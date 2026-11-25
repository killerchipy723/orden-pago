from flask import Flask, render_template
from db import get_connection
from datetime import datetime
from zoneinfo import ZoneInfo

from routes.orden_pago import orden_pago_bp
from routes.orden_pago_pdf import orden_pago_bp as orden_pago_pdf_bp
from routes.recaudaciones import recaudaciones_bp


app = Flask(__name__)

app.register_blueprint(orden_pago_bp)
app.register_blueprint(orden_pago_pdf_bp)
app.register_blueprint(recaudaciones_bp)

app.config["SECRET_KEY"] = "municipalidad-secret-key"


def obtener_datos_base():
    conexion = get_connection()
    fecha_hoy = datetime.now(
        ZoneInfo("America/Argentina/Buenos_Aires")
    ).strftime("%%Y-%%m-%%d")

    try:
        with conexion.cursor() as cursor:
            cursor.execute("SELECT * FROM gastos")
            gastos = cursor.fetchall()

            cursor.execute("SELECT * FROM plancuenta WHERE estado = 'ACTIVO'")
            cuenta = cursor.fetchall()

            cursor.execute("SELECT * FROM ordenpago ORDER BY idOrden DESC")
            ordenes = cursor.fetchall()

            cursor.execute("""
                SELECT
                    r.idrecaudacion,
                    DATE_FORMAT(r.fecha, '%Y-%m-%d') AS fecha,
                    r.nrecibo,
                    r.idcontribuyente,
                    CONCAT(c.apellido, ' ', c.nombre) AS contribuyente,
                    c.dni,
                    r.idconcepto,
                    co.detalle AS concepto,
                    r.monto,
                    r.modopago
                FROM recaudacion r
                JOIN contribuyente c ON r.idcontribuyente = c.idcontribuyente
                JOIN concepto co ON r.idconcepto = co.idconcepto
                ORDER BY r.fecha DESC, r.idrecaudacion DESC
            """)
            recaudaciones = cursor.fetchall()

            cursor.execute("""
                SELECT idcontribuyente, CONCAT(apellido, ' ', nombre) AS apenomb, dni
                FROM contribuyente
                ORDER BY apellido ASC, nombre ASC
            """)
            contribuyentes = cursor.fetchall()

            cursor.execute("SELECT idconcepto, detalle FROM concepto ORDER BY detalle ASC")
            conceptos_ingreso = cursor.fetchall()

        cuenta_default = ""
        for c in cuenta:
            if c.get("idorden") == 2:
                cuenta_default = c.get("cuenta", "")
                break

        return {
            "ordenes": ordenes,
            "gastos": gastos,
            "fecha_hoy": fecha_hoy,
            "cuenta": cuenta,
            "cuenta_default": cuenta_default,
            "recaudaciones": recaudaciones,
            "contribuyentes": contribuyentes,
            "conceptos_ingreso": conceptos_ingreso,
        }
    finally:
        conexion.close()


@app.route("/")
def home():
    datos = obtener_datos_base()
    return render_template("index.html", **datos)


@app.route("/recaudaciones")
def vista_recaudaciones():
    datos = obtener_datos_base()
    return render_template("recaudaciones.html", **datos)


@app.route("/test-db")
def test_db():
    try:
        conn = get_connection()

        with conn.cursor() as cursor:
            cursor.execute("SELECT NOW() AS fecha")
            resultado = cursor.fetchone()

        conn.close()

        return {
            "estado": "ok",
            "fecha_servidor": str(resultado["fecha"])
        }

    except Exception as e:
        return {
            "estado": "error",
            "mensaje": str(e)
        }, 500


print(app.url_map)
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=6350,
        debug=False
    )