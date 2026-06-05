
from flask import Blueprint, request, jsonify,redirect,render_template,flash,url_for
from db import get_connection
from datetime import datetime
from zoneinfo import ZoneInfo

orden_pago_bp = Blueprint(
    "orden_pago",
    __name__
)

# ==========================
# LISTAR ORDENES
# ==========================

@orden_pago_bp.route("/api/orden_pago", methods=["GET"])
def listar_ordenes():

    conn = get_connection()

    try:

        with conn.cursor() as cursor:

            modo = request.args.get("modo")

            if modo:

                sql = """
                    SELECT *
                    FROM ordenpago
                    WHERE modo = %s
                    ORDER BY idOrden DESC
                """

                cursor.execute(sql, (modo,))

            else:

                sql = """
                    SELECT *
                    FROM ordenpago
                    ORDER BY idOrden DESC
                """

                cursor.execute(sql)

            datos = cursor.fetchall()

        return jsonify(datos)

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        conn.close()


# ==========================
# BUSCAR ORDEN POR ID
# ==========================

@orden_pago_bp.route("/api/orden_pago/<int:id_orden>", methods=["GET"])
def buscar_orden(id_orden):

    conn = get_connection()

    try:

        with conn.cursor() as cursor:

            sql = """
                SELECT *
                FROM ordenpago
                WHERE idOrden = %s
            """

            cursor.execute(sql, (id_orden,))

            orden = cursor.fetchone()

            if not orden:

                return jsonify({
                    "success": False,
                    "message": "Orden no encontrada"
                }), 404

            return jsonify(orden)

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        conn.close()


# ==========================
# ULTIMA ORDEN
# ==========================

@orden_pago_bp.route("/api/orden_pago/ultima", methods=["GET"])
def ultima_orden():

    conn = get_connection()

    try:

        with conn.cursor() as cursor:

            sql = """
                SELECT *
                FROM ordenpago
                ORDER BY idOrden DESC
                LIMIT 1
            """

            cursor.execute(sql)

            orden = cursor.fetchone()

            return jsonify(orden)

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        conn.close()


# ==========================
# CREAR ORDEN
# ==========================

@orden_pago_bp.route("/api/orden_pago", methods=["POST"])
def crear_orden():

    data = request.get_json()

    conn = get_connection()

    try:

        with conn.cursor() as cursor:

            sql = """
            INSERT INTO ordenpago
            (
                fecha,
                beneficiario,
                cantidad,
                concepto,
                modo,
                nCheque,
                importe,
                cuenta,
                estado,
                observacion
            )
            VALUES
            (
                %s,%s,%s,%s,%s,%s,%s,%s,%s,%s
            )
            """

            cursor.execute(
                sql,
                (
                    data["fecha"],
                    data["beneficiario"],
                    data["cantidad"],
                    data["concepto"],
                    data["modo"],
                    data["nCheque"],
                    data["importe"],
                    data["cuenta"],
                    data["estado"],
                    data["observacion"]
                )
            )

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Orden registrada correctamente"
        })

    except Exception as e:

        conn.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        conn.close()


# ==========================
# MODIFICAR ORDEN
# ==========================

@orden_pago_bp.route("/api/orden_pago/<int:id_orden>", methods=["PUT"])
def modificar_orden(id_orden):

    data = request.get_json()

    conn = get_connection()

    try:

        with conn.cursor() as cursor:

            sql = """
            UPDATE ordenpago
            SET
                fecha=%s,
                beneficiario=%s,
                cantidad=%s,
                concepto=%s,
                modo=%s,
                nCheque=%s,
                importe=%s,
                cuenta=%s,
                estado=%s,
                observacion=%s
            WHERE idOrden=%s
            """

            cursor.execute(
                sql,
                (
                    data["fecha"],
                    data["beneficiario"],
                    data["cantidad"],
                    data["concepto"],
                    data["modo"],
                    data["nCheque"],
                    data["importe"],
                    data["cuenta"],
                    data["estado"],
                    data["observacion"],
                    id_orden
                )
            )

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Orden modificada correctamente"
        })

    except Exception as e:

        conn.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        conn.close()


# ==========================
# ELIMINAR ORDEN
# ==========================

@orden_pago_bp.route("/api/orden_pago/<int:id_orden>", methods=["DELETE"])
def eliminar_orden(id_orden):

    conn = get_connection()

    try:

        with conn.cursor() as cursor:

            sql = """
                DELETE
                FROM ordenpago
                WHERE idOrden=%s
            """

            cursor.execute(sql, (id_orden,))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Orden eliminada"
        })

    except Exception as e:

        conn.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        conn.close()

@orden_pago_bp.route("/GuardarOrden", methods=["POST"])
def guardar_orden():

    conexion = get_connection()

    try:

        cursor = conexion.cursor()

        fecha = request.form["fecha"]
        beneficiario = request.form["beneficiario"].upper()
        cantidad = request.form["cantidad"]
        concepto = request.form["concepto"]
        modo = request.form["modo"]
        nCheque = request.form.get("nCheque", "")
        nTransferencia = request.form.get("nTransferencia", "")     
        importe = request.form["importe"]
        cuenta = request.form["cuenta"]
        estado = request.form["estado"]
        observacion = request.form["observacion"]
        numero_operacion = nCheque if nCheque and nCheque != "0" else nTransferencia

        

        sql = """
            INSERT INTO ordenpago
            (
                fecha,
                beneficiario,
                cantidad,
                concepto,
                modo,
                ncheque,
                importe,
                cuenta,
                estado,
                observacion
            )
            VALUES
            (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """

        cursor.execute(
            sql,
            (
                fecha,
                beneficiario,
                cantidad,
                concepto,
                modo,
                numero_operacion,
                importe,
                cuenta,
                estado,
                observacion 
            )
        )

        conexion.commit()

        # ID recién generado
        id_orden = cursor.lastrowid

        flash(
            "Orden de pago registrada correctamente",
            "success"
        )

        return redirect(
            url_for(
                 "orden_pago_pdf.generar_orden_pdf",
                idorden=id_orden
            )
        )

    except Exception as e:

        conexion.rollback()

        flash(
            f"Error al guardar la orden: {str(e)}",
            "danger"
        )

        return redirect(url_for("home"))

    finally:

        cursor.close()
        conexion.close()