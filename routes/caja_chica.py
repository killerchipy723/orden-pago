from flask import Blueprint, request, jsonify
from db import get_connection

caja_chica_bp = Blueprint("caja_chica", __name__)


# ==========================
# LISTAR MOVIMIENTOS CAJA CHICA
# ==========================
@caja_chica_bp.route("/api/caja-chica", methods=["GET"])
def listar_caja_chica():
    conn = get_connection()
    try:
        fecha = request.args.get("fecha", "").strip()
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    id_caja,
                    CAST(fecha AS CHAR) AS fecha,
                    proveedor,
                    concepto,
                    comprobante,
                    importe
                FROM caja_chica
            """
            params = []
            if fecha:
                sql += " WHERE fecha = %s"
                params.append(fecha)

            sql += " ORDER BY id_caja DESC"
            cursor.execute(sql, tuple(params))
            datos = cursor.fetchall()

        return jsonify(datos)
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


# ==========================
# OBTENER UN MOVIMIENTO
# ==========================
@caja_chica_bp.route("/api/caja-chica/<int:id_caja>", methods=["GET"])
def obtener_caja_chica(id_caja):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    id_caja,
                    CAST(fecha AS CHAR) AS fecha,
                    proveedor,
                    concepto,
                    comprobante,
                    importe
                FROM caja_chica
                WHERE id_caja = %s
                """,
                (id_caja,),
            )
            fila = cursor.fetchone()

        if not fila:
            return jsonify({"success": False, "message": "Registro no encontrado"}), 404

        return jsonify(fila)
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


# ==========================
# REGISTRAR CAJA CHICA
# ==========================
@caja_chica_bp.route("/api/caja-chica", methods=["POST"])
def guardar_caja_chica():
    data = request.get_json() or {}
    conn = get_connection()
    try:
        fecha = str(data.get("fecha", "")).strip()
        proveedor = str(data.get("proveedor", "")).strip().upper()
        concepto = str(data.get("concepto", "")).strip().upper()
        comprobante = int(data.get("comprobante", 0))
        importe = float(data.get("importe", 0))

        if not all([fecha, proveedor, concepto]) or comprobante <= 0 or importe <= 0:
            return jsonify({"success": False, "message": "Complete todos los campos con valores válidos."}), 400

        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO caja_chica (fecha, proveedor, concepto, comprobante, importe)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (fecha, proveedor, concepto, comprobante, importe),
            )
            nuevo_id = cursor.lastrowid

        conn.commit()
        return jsonify({
            "success": True,
            "message": "Registro de caja chica guardado correctamente",
            "id_caja": nuevo_id,
        })
    except ValueError:
        conn.rollback()
        return jsonify({"success": False, "message": "Comprobante e importe deben ser numéricos."}), 400
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


# ==========================
# MODIFICAR CAJA CHICA
# ==========================
@caja_chica_bp.route("/api/caja-chica/<int:id_caja>", methods=["PUT"])
def modificar_caja_chica(id_caja):
    data = request.get_json() or {}
    conn = get_connection()
    try:
        fecha = str(data.get("fecha", "")).strip()
        proveedor = str(data.get("proveedor", "")).strip().upper()
        concepto = str(data.get("concepto", "")).strip().upper()
        comprobante = int(data.get("comprobante", 0))
        importe = float(data.get("importe", 0))

        if not all([fecha, proveedor, concepto]) or comprobante <= 0 or importe <= 0:
            return jsonify({"success": False, "message": "Complete todos los campos con valores válidos."}), 400

        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE caja_chica
                SET fecha = %s,
                    proveedor = %s,
                    concepto = %s,
                    comprobante = %s,
                    importe = %s
                WHERE id_caja = %s
                """,
                (fecha, proveedor, concepto, comprobante, importe, id_caja),
            )
            afectadas = cursor.rowcount

        conn.commit()
        if afectadas == 0:
            return jsonify({"success": False, "message": "No se encontró el registro para actualizar."}), 404

        return jsonify({
            "success": True,
            "message": "Registro actualizado correctamente",
            "id_caja": id_caja,
        })
    except ValueError:
        conn.rollback()
        return jsonify({"success": False, "message": "Comprobante e importe deben ser numéricos."}), 400
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


# ==========================
# ELIMINAR CAJA CHICA
# ==========================
@caja_chica_bp.route("/api/caja-chica/<int:id_caja>", methods=["DELETE"])
def eliminar_caja_chica(id_caja):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM caja_chica WHERE id_caja = %s", (id_caja,))
        conn.commit()
        return jsonify({"success": True, "message": "Registro eliminado correctamente"})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


# ==========================
# RESUMEN DIARIO (INGRESOS vs EGRESOS)
# ==========================
@caja_chica_bp.route("/api/caja-chica/diaria", methods=["GET"])
def resumen_diario_caja():
    fecha = request.args.get("fecha", "").strip()
    if not fecha:
        return jsonify({"success": False, "message": "Debe indicar una fecha."}), 400

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT r.nrecibo AS comprobante, c.detalle AS concepto, r.monto AS importe
                FROM recaudacion r
                JOIN concepto c ON r.idconcepto = c.idconcepto
                WHERE r.fecha = %s
                """,
                (fecha,),
            )
            ingresos = cursor.fetchall()

            cursor.execute(
                """
                SELECT idorden AS comprobante, concepto, importe
                FROM ordenpago
                WHERE fecha = %s
                UNION ALL
                SELECT comprobante, concepto, importe
                FROM caja_chica
                WHERE fecha = %s
                """,
                (fecha, fecha),
            )
            egresos = cursor.fetchall()

        total_ingresos = sum(float(x.get("importe") or 0) for x in ingresos)
        total_egresos = sum(float(x.get("importe") or 0) for x in egresos)

        return jsonify({
            "success": True,
            "fecha": fecha,
            "ingresos": ingresos,
            "egresos": egresos,
            "total_ingresos": total_ingresos,
            "total_egresos": total_egresos,
            "saldo_dia": total_ingresos - total_egresos,
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()