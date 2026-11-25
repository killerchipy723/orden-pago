from flask import Blueprint, request, jsonify
from db import get_connection

recaudaciones_bp = Blueprint("recaudaciones", __name__)


# ==========================
# LISTAR RECAUDACIONES
# ==========================
@recaudaciones_bp.route("/api/recaudaciones", methods=["GET"])
def listar_recaudaciones():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            modopago = request.args.get("modopago", "").strip()

            sql = """
                SELECT
                    r.idrecaudacion,
                    DATE_FORMAT(r.fecha, '%%Y-%%m-%%d') AS fecha,
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
            """

            params = []
            if modopago:
                sql += " WHERE r.modopago = %s"
                params.append(modopago)

            sql += " ORDER BY r.fecha DESC, r.idrecaudacion DESC"
            cursor.execute(sql, tuple(params))
            datos = cursor.fetchall()

        return jsonify(datos)
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


# ==========================
# BUSCAR UNA RECAUDACIÓN
# ==========================
@recaudaciones_bp.route("/api/recaudaciones/<int:id_rec>", methods=["GET"])
def obtener_recaudacion(id_rec):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    r.idrecaudacion,
                    DATE_FORMAT(r.fecha, '%%Y-%%m-%%d') AS fecha,
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
                WHERE r.idrecaudacion = %s
            """
            cursor.execute(sql, (id_rec,))
            fila = cursor.fetchone()

        if not fila:
            return jsonify({"success": False, "message": "Recaudación no encontrada"}), 404

        return jsonify(fila)
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


# ==========================
# GUARDAR RECAUDACIÓN
# ==========================
@recaudaciones_bp.route("/api/recaudaciones", methods=["POST"])
def guardar_recaudacion():
    data = request.get_json()
    conn = get_connection()

    try:
        fecha = data.get("fecha", "").strip()
        nrecibo = int(data.get("nrecibo", 0))
        idcontribuyente = int(data.get("idcontribuyente", 0))
        idconcepto = int(data.get("idconcepto", 0))
        monto = float(data.get("monto", 0))
        modopago = data.get("modopago", "").strip()

        if not all([fecha, nrecibo, idcontribuyente, idconcepto, modopago]) or monto <= 0:
            return jsonify({"success": False, "message": "Complete todos los campos obligatorios."}), 400

        with conn.cursor() as cursor:
            sql = """
                INSERT INTO recaudacion (fecha, nrecibo, idcontribuyente, idconcepto, monto, modopago)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (fecha, nrecibo, idcontribuyente, idconcepto, monto, modopago))
            nuevo_id = cursor.lastrowid

        conn.commit()
        return jsonify({
            "success": True,
            "message": "Recaudación registrada correctamente",
            "idrecaudacion": nuevo_id
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


# ==========================
# MODIFICAR RECAUDACIÓN
# ==========================
@recaudaciones_bp.route("/api/recaudaciones/<int:id_rec>", methods=["PUT"])
def modificar_recaudacion(id_rec):
    data = request.get_json()
    conn = get_connection()

    try:
        fecha = data.get("fecha", "").strip()
        nrecibo = int(data.get("nrecibo", 0))
        idcontribuyente = int(data.get("idcontribuyente", 0))
        idconcepto = int(data.get("idconcepto", 0))
        monto = float(data.get("monto", 0))
        modopago = data.get("modopago", "").strip()

        if not all([fecha, nrecibo, idcontribuyente, idconcepto, modopago]) or monto <= 0:
            return jsonify({"success": False, "message": "Complete todos los campos obligatorios."}), 400

        with conn.cursor() as cursor:
            sql = """
                UPDATE recaudacion
                SET fecha = %s,
                    nrecibo = %s,
                    idcontribuyente = %s,
                    idconcepto = %s,
                    monto = %s,
                    modopago = %s
                WHERE idrecaudacion = %s
            """
            cursor.execute(sql, (fecha, nrecibo, idcontribuyente, idconcepto, monto, modopago, id_rec))

        conn.commit()
        return jsonify({
            "success": True,
            "message": "Recaudación actualizada correctamente",
            "idrecaudacion": id_rec
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


# ==========================
# ELIMINAR RECAUDACIÓN
# ==========================
@recaudaciones_bp.route("/api/recaudaciones/<int:id_rec>", methods=["DELETE"])
def eliminar_recaudacion(id_rec):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM recaudacion WHERE idrecaudacion = %s", (id_rec,))
        conn.commit()
        return jsonify({"success": True, "message": "Recaudación eliminada correctamente"})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


# ==========================
# ALTA RÁPIDA DE CONTRIBUYENTE
# ==========================
@recaudaciones_bp.route("/api/contribuyentes", methods=["POST"])
def guardar_contribuyente():
    data = request.get_json()
    conn = get_connection()
    try:
        apellido = data.get("apellido", "").strip().upper()
        nombre = data.get("nombre", "").strip().upper()
        dni = data.get("dni", "").strip()

        if not apellido or not nombre or not dni:
            return jsonify({"success": False, "message": "Complete apellido, nombre y DNI."}), 400

        with conn.cursor() as cursor:
            cursor.execute("SELECT idcontribuyente FROM contribuyente WHERE dni = %s", (dni,))
            if cursor.fetchone():
                return jsonify({"success": False, "message": "Ya existe un contribuyente con ese DNI."}), 400

            cursor.execute(
                "INSERT INTO contribuyente (apellido, nombre, dni) VALUES (%s, %s, %s)",
                (apellido, nombre, dni)
            )
            nuevo_id = cursor.lastrowid

        conn.commit()
        return jsonify({
            "success": True,
            "message": "Contribuyente registrado correctamente",
            "contribuyente": {
                "idcontribuyente": nuevo_id,
                "apenomb": f"{apellido} {nombre}",
                "dni": dni
            }
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


# ==========================
# ALTA RÁPIDA DE CONCEPTO DE INGRESO
# ==========================
@recaudaciones_bp.route("/api/conceptos-ingreso", methods=["POST"])
def guardar_concepto_ingreso():
    data = request.get_json()
    conn = get_connection()
    try:
        detalle = data.get("detalle", "").strip().upper()
        if not detalle:
            return jsonify({"success": False, "message": "Ingrese el detalle del concepto."}), 400

        with conn.cursor() as cursor:
            cursor.execute("SELECT idconcepto FROM concepto WHERE detalle = %s", (detalle,))
            if cursor.fetchone():
                return jsonify({"success": False, "message": "Ese concepto ya existe."}), 400

            cursor.execute("INSERT INTO concepto (detalle) VALUES (%s)", (detalle,))
            nuevo_id = cursor.lastrowid

        conn.commit()
        return jsonify({
            "success": True,
            "message": "Concepto agregado correctamente",
            "concepto": {
                "idconcepto": nuevo_id,
                "detalle": detalle
            }
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()