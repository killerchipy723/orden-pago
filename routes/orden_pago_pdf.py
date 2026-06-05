
from flask import Blueprint, send_file
from db import get_connection

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

from io import BytesIO
import os


orden_pago_bp = Blueprint(
    "orden_pago_pdf",
    __name__
)


@orden_pago_bp.route("/orden_pago/pdf/<int:idorden>")
def generar_orden_pdf(idorden):

    conexion = get_connection()

    try:

        cursor = conexion.cursor()

        cursor.execute("""
            SELECT *
            FROM ordenpago
            WHERE idOrden = %s
        """, (idorden,))

        orden = cursor.fetchone()

        if not orden:
            return "Orden no encontrada", 404

        buffer = BytesIO()

        pdf = canvas.Canvas(
            buffer,
            pagesize=A4
        )

        ancho, alto = A4

        import os

        BASE_DIR = os.path.dirname(
            os.path.dirname(
                os.path.abspath(__file__)
            )
        )

        ruta_escudo = os.path.join(
            BASE_DIR,
            "static",
            "img",
            "icon.png"
        )

        print("RUTA:", ruta_escudo)
        print("EXISTE:", os.path.exists(ruta_escudo))

        def dibujar_copia(y_inicio, titulo):

            # ESCUDO

            if os.path.exists(ruta_escudo):

                pdf.drawImage(
                    ImageReader(ruta_escudo),
                    50,
                    y_inicio - 55,
                    width=70,
                    height=70,
                    preserveAspectRatio=True,
                    mask="auto"
                )

            # ENCABEZADO

            pdf.setFont("Helvetica-Bold", 11)
            pdf.drawString(
                130,
                y_inicio,
                "MUNICIPALIDAD DE RIO PIEDRAS"
            )

            pdf.setFont("Helvetica", 9)
            pdf.drawString(
                130,
                y_inicio - 15,
                "Provincia de Salta"
            )

            pdf.setFont("Helvetica-Bold", 16)
            pdf.drawCentredString(
                ancho / 2,
                y_inicio - 35,
                "ORDEN DE PAGO"
            )

            pdf.setFont("Helvetica-Bold", 12)
            pdf.drawCentredString(
                ancho / 2,
                y_inicio - 49,
                titulo
            )

            y = y_inicio - 80

            pdf.setFont("Helvetica-Bold", 10)

            pdf.drawRightString(
                ancho - 40,
                y,
                f"N° Orden: {orden['idorden']}"
            )

            y -= 15

            pdf.line(
                40,
                y,
                ancho - 40,
                y
            )

            y -= 20

            pdf.setFont("Helvetica",10)

            pdf.drawRightString(
                ancho - 40,
                y,
                f"Fecha: {orden['fecha']}"
            )

            y -= 15

            pdf.line(
                40,
                y,
                ancho - 40,
                y
            )

            y -= 25

            pdf.setFont("Helvetica-Bold", 11)

            pdf.drawCentredString(
                ancho / 2,
                y,
                "PAGUESE A"
            )

            y -= 20

            pdf.setFont("Helvetica", 11)

            pdf.drawString(
                50,
                y,
                str(orden["beneficiario"])
            )

            y -= 10

            pdf.line(
                40,
                y,
                ancho - 40,
                y
            )

            y -= 25

            pdf.setFont("Helvetica-Bold", 10)

            texto = f"La cantidad de Pesos: {orden['cantidad']}"

            ancho_maximo = 500

            lineas = []
            palabras = texto.split()

            linea_actual = ""

            for palabra in palabras:

                prueba = linea_actual + " " + palabra if linea_actual else palabra

                if pdf.stringWidth(prueba, "Helvetica-Bold", 10) < ancho_maximo:
                    linea_actual = prueba
                else:
                    lineas.append(linea_actual)
                    linea_actual = palabra

            if linea_actual:
                lineas.append(linea_actual)

            for linea in lineas:
                pdf.drawString(50, y, linea)
                y -= 15

            pdf.setFont("Helvetica", 10)

            pdf.drawString(
                50,
                y,
                f"En concepto de: {orden['concepto']}"
            )

            y -= 18

            pdf.drawString(
                50,
                y,
                f"Modo de Pago: {orden['modo']}"
            )

            y -= 18

            

            pdf.drawString(
                50,
                y,
                f"N° Cheque / Transferencia: {orden['ncheque']}"
            )

            y -= 18

            pdf.drawString(
                50,
                y,
                f"Cuenta: {orden['cuenta']}"
            )

            y -= 18

            pdf.drawString(
                50,
                y,
                f"Detalle: {orden['observacion']}"
            )

            y -= 30

            importe = float(
                orden["importe"]
            )

            pdf.setFont(
                "Helvetica-Bold",
                11
            )

            pdf.drawRightString(
                ancho - 50,
                y,
                f"Importe: $ {importe:,.2f}"
            )

            y -= 40

            pdf.line(
                120,
                y,
                250,
                y
            )

            pdf.drawString(
                165,
                y - 15,
                "TESORERO"
            )

            y -= 35

            pdf.line(
                40,
                y,
                ancho - 40,
                y
            )

            y -= 20

            pdf.drawString(
                50,
                y,
                "Recibí conforme el importe de la presente Orden de Pago"
            )

            y -= 25

            pdf.drawString(
                50,
                y,
                "Río Piedras: ............ de ............................. del ................"
            )

            y -= 50

            pdf.line(
                ancho - 230,
                y,
                ancho - 60,
                y
            )

            pdf.drawString(
                ancho - 185,
                y - 15,
                "FIRMA DEL RECEPTOR"
            )

            y -= 40

            pdf.line(
                ancho - 230,
                y,
                ancho - 60,
                y
            )

            pdf.drawString(
                ancho - 150,
                y - 15,
                "ACLARACION"
            )

            y -= 40

            pdf.line(
                ancho - 230,
                y,
                ancho - 60,
                y
            )

            pdf.drawString(
                ancho - 150,
                y - 15,
                "DOCUMENTO"
            )

        # ==========================
        # PAGINA 1 - ORIGINAL
        # ==========================

        dibujar_copia(
            alto - 50,
            "ORIGINAL"
        )

        # NUEVA PAGINA

        pdf.showPage()

        # ==========================
        # PAGINA 2 - DUPLICADO
        # ==========================

        dibujar_copia(
            alto - 50,
            "DUPLICADO"
        )

        pdf.save()

        buffer.seek(0)

        return send_file(
            buffer,
            mimetype="application/pdf",
            as_attachment=False,
            download_name=f"OrdenPago_{idorden}.pdf"
        )

    finally:

        cursor.close()
        conexion.close()

