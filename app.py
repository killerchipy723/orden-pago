from flask import Flask, render_template
from db import get_connection
from datetime import datetime
from zoneinfo import ZoneInfo

from routes.orden_pago import orden_pago_bp
from routes.orden_pago_pdf import orden_pago_bp as orden_pago_pdf_bp


app = Flask(__name__)

app.register_blueprint(orden_pago_bp)
app.register_blueprint(orden_pago_pdf_bp)


app.config["SECRET_KEY"] = "municipalidad-secret-key"


@app.route("/")
def home():

    conexion = get_connection()
    fecha_hoy = datetime.now(
        ZoneInfo("America/Argentina/Buenos_Aires")
    ).strftime("%Y-%m-%d")

    try:

        cursor = conexion.cursor()
        cursor2 = conexion.cursor()
        cursor3 = conexion.cursor()
        cursor2.execute("select * from gastos")
        cursor3.execute("SELECT * FROM plancuenta WHERE estado = 'ACTIVO'")
        cursor.execute("""
            SELECT
                *
            FROM ordenpago
            ORDER BY idOrden DESC
        """)

        ordenes = cursor.fetchall()
        gastos = cursor2.fetchall()
        cuenta = cursor3.fetchall()

        cuenta_default = ""
       

        for c in cuenta:
            if c["idorden"] == 2:
                cuenta_default = c["cuenta"]
                break

        return render_template(
            "index.html",
            ordenes=ordenes,gastos=gastos,fecha_hoy=fecha_hoy,cuenta=cuenta,cuenta_default=cuenta_default
        )

    finally:
        cursor.close()
        conexion.close()

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
        port=5000,
        debug=True
    )