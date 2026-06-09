document.addEventListener("DOMContentLoaded", function () {
    cargarOrdenes()
    
    

        const importe = document.getElementById("importe");
        const cantidad = document.getElementById("cantidad");

        const modal =
        document.getElementById("ordenPagoModal");

    modal.addEventListener(
        "shown.bs.modal",
        function () {

            setTimeout(() => {

                document
                    .getElementById("beneficiario")
                    .focus();

            }, 100);

        }
    );

    const txtBuscar =
    document.getElementById("buscarOrden");

if (txtBuscar) {

    txtBuscar.addEventListener(
        "input",
        filtrarTablaOrdenes
    );

}

       

        if (!importe || !cantidad) {
            console.error("No se encontró #importe o #cantidad");
            return;
        }

        importe.addEventListener("blur", function () {

            let valor = parseFloat(this.value);
            if (isNaN(valor)) {
                cantidad.value = "";
                return;
            }

            if (isNaN(valor)) {
                cantidad.value = "";
                return;
            }

            cantidad.value = numeroALetras(valor);

        });

    });

    function numeroALetras(numero) {

        const enteros = Math.floor(numero);
        const centavos = Math.round((numero - enteros) * 100);

        return convertirNumero(enteros).toUpperCase()
            + " CON "
            + centavos.toString().padStart(2, "0")
            + "/100";
    }

    function convertirNumero(numero) {

        const unidades = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];

        const especiales = [
            "diez", "once", "doce", "trece", "catorce",
            "quince", "dieciseis", "diecisiete",
            "dieciocho", "diecinueve"
        ];

        const decenas = [
            "", "", "veinte", "treinta", "cuarenta",
            "cincuenta", "sesenta", "setenta",
            "ochenta", "noventa"
        ];

        const centenas = [
            "", "ciento", "doscientos", "trescientos",
            "cuatrocientos", "quinientos", "seiscientos",
            "setecientos", "ochocientos", "novecientos"
        ];

        if (numero === 0) return "cero";
        if (numero === 100) return "cien";

        if (numero < 10)
            return unidades[numero];

        if (numero < 20)
            return especiales[numero - 10];

        if (numero < 100) {

            const d = Math.floor(numero / 10);
            const u = numero % 10;

            if (d === 2 && u > 0)
                return "veinti" + unidades[u];

            return decenas[d] + (u ? " y " + unidades[u] : "");
        }

        if (numero < 1000) {

            const c = Math.floor(numero / 100);
            const resto = numero % 100;

            return centenas[c] +
                (resto ? " " + convertirNumero(resto) : "");
        }

        if (numero < 1000000) {

            const miles = Math.floor(numero / 1000);
            const resto = numero % 1000;

            let texto = miles === 1
                ? "mil"
                : convertirNumero(miles) + " mil";

            if (resto)
                texto += " " + convertirNumero(resto);

            return texto;
        }

        if (numero < 1000000000) {

            const millones = Math.floor(numero / 1000000);
            const resto = numero % 1000000;

            let texto = millones === 1
                ? "un millon"
                : convertirNumero(millones) + " millones";

            if (resto)
                texto += " " + convertirNumero(resto);

            return texto;
        }

        if (numero < 1000000000000) {

            const milesMillones = Math.floor(numero / 1000000000);
            const resto = numero % 1000000000;

            let texto = convertirNumero(milesMillones)
                + " mil millones";

            if (resto)
                texto += " " + convertirNumero(resto);

            return texto;
        }

        return numero.toString();
    }


    

document.addEventListener("DOMContentLoaded", function(){

    const modo = document.getElementById("modo");

    const divCheque = document.getElementById("divCheque");
    const divTransferencia = document.getElementById("divTransferencia");

    function actualizarCampos(){

        divCheque.classList.add("d-none");
        divTransferencia.classList.add("d-none");

        if(modo.value === "Cheque"){

            divCheque.classList.remove("d-none");

        }
        else if(modo.value === "Transferencia"){

            divTransferencia.classList.remove("d-none");

        }

    }

    modo.addEventListener("change", actualizarCampos);

    actualizarCampos();

});


document.getElementById("formOrdenPago").addEventListener("submit", async function(e){

    e.preventDefault();

    const form = this;
    const formData = new FormData(form);

    try {

        const response = await fetch("/GuardarOrden", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if(data.success){

            // Abrir PDF en nueva pestaña
            window.open(
                "/orden_pago/pdf/" + data.idorden,
                "_blank"
            );

            // Limpiar formulario
            form.reset();
            cargarOrdenes();

            // Limpiar campos ocultos si los tenés
            document.getElementById("nCheque").value = "";
            document.getElementById("nTransferencia").value = "";

            // Volver a cargar fecha actual si corresponde
            const fecha = document.getElementById("fecha");
            if(fecha){
                fecha.value = new Date().toISOString().split("T")[0];
            }

        } else {

            alert(data.message);

        }

    } catch(error){

        console.error(error);
        alert("Error al guardar la orden");

    }

});

function formatearFecha(fechaMysql) {

    const fecha = new Date(fechaMysql);

    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = fecha.getFullYear();

    return `${dia}-${mes}-${anio}`;

}



// -------------- Funcion para cargar la tabla de orden de pago ---------------------------------------
async function cargarOrdenes() {

    try {

        const modo = document.getElementById("filtroModo").value;
       

        let url = "/api/orden_pago";

        if (modo) {
            url += "?modo=" + encodeURIComponent(modo);
        }

        const response = await fetch(url);
        const ordenes = await response.json();

        const tbody = document.querySelector("#tablaOrdenes tbody");

        tbody.innerHTML = "";

        ordenes.forEach(orden => {

            const fila = document.createElement("tr");

            fila.style.cursor = "pointer";

            fila.innerHTML = `
                <td>${orden.idorden}</td>
                <td>${formatearFecha(orden.fecha)}</td>
                <td>${orden.beneficiario}</td>
                <td>${orden.concepto}</td>
                <td>$${parseFloat(orden.importe).toLocaleString('es-AR')}</td>
                <td>${orden.modo}</td>
                <td>${orden.ncheque}</td>
            `;

            fila.addEventListener("click", () => {

                document
                    .querySelectorAll("#tablaOrdenes tbody tr")
                    .forEach(tr => tr.classList.remove("table-primary"));

                fila.classList.add("table-primary");

                cargarOrdenEnFormulario(
                    orden.idorden
                );

            });

            tbody.appendChild(fila);

        });

    } catch (error) {

        console.error(
            "Error cargando órdenes:",
            error
        );

    }

}

// ---------------------- CARGAR ORDEN EN FORMULARIO ----------------------
async function cargarOrdenEnFormulario(idOrden) {

    try {

        const response = await fetch(
            `/api/orden_pago/${idOrden}`
        );

        const orden = await response.json();

        // ID
        document.getElementById("idOrden").value =
            orden.idorden;

        // FECHA
        if (orden.fecha) {

    const fecha = new Date(orden.fecha);

    const fechaFormateada =
        fecha.getFullYear() + "-" +
        String(fecha.getMonth() + 1).padStart(2, "0") + "-" +
        String(fecha.getDate()).padStart(2, "0");

    document.getElementById("fecha").value =
        fechaFormateada;

}

        // DATOS GENERALES
        document.getElementById("beneficiario").value =
            orden.beneficiario || "";

        document.getElementById("cantidad").value =
            orden.cantidad || "";

        document.getElementById("concepto").value =
            orden.concepto || "";

        document.getElementById("importe").value =
            orden.importe || "";

        document.getElementById("cuenta").value =
            orden.cuenta || "0";

        document.getElementById("estado").value =
            orden.estado || "";

        document.getElementById("observacion").value =
            orden.observacion || "";

        // MODO DE PAGO
        const modo = (orden.modo || "").toUpperCase();

        const selectModo =
            document.getElementById("modo");

        if (modo === "CHEQUE") {

            selectModo.value = "Cheque";

        } else if (modo === "TRANSFERENCIA") {

            selectModo.value = "Transferencia";

        } else if (modo === "EFECTIVO") {

            selectModo.value = "Efectivo";

        } else {

            selectModo.value = orden.modo;

        }

        // MOSTRAR / OCULTAR CAMPOS
        const divCheque =
            document.getElementById("divCheque");

        const divTransferencia =
            document.getElementById("divTransferencia");

        const txtCheque =
            document.getElementById("nCheque");

        const txtTransferencia =
            document.getElementById("nTransferencia");

        divCheque.classList.add("d-none");
        divTransferencia.classList.add("d-none");

        txtCheque.value = "0";
        txtTransferencia.value = "0";

        if (modo === "CHEQUE") {

            divCheque.classList.remove("d-none");

            txtCheque.value =
                orden.ncheque || "";

        }

        if (modo === "TRANSFERENCIA") {

            divTransferencia.classList.remove("d-none");

            txtTransferencia.value =
                orden.ncheque || "";

        }

        // BOTONES
        const btnGuardar =
            document.getElementById("btnGuardar");

        const btnModificar =
            document.getElementById("btnModificar");

        const btnImprimir =
            document.getElementById("btnImprimir");

        if (btnGuardar)
            btnGuardar.disabled = true;

        if (btnModificar)
            btnModificar.disabled = false;

        if (btnImprimir)
            btnImprimir.disabled = false;

    } catch (error) {

        console.error(
            "Error cargando orden:",
            error
        );

    }

}

//----------------------- MODIFICAR ORDEN DE PAGO -----------------------
async function modificarOrden() {

    try {

        const idOrden =
            document.getElementById("idOrden").value;

        if (!idOrden) {

            alert(
                "Seleccione una orden para modificar."
            );

            return;
        }

        const datos = {

            fecha:
                document.getElementById("fecha").value,

            beneficiario:
                document.getElementById("beneficiario").value,

            cantidad:
                document.getElementById("cantidad").value,

            concepto:
                document.getElementById("concepto").value,

            modo:
                document.getElementById("modo").value,

            nCheque:
                document.getElementById("nCheque").value,

            nTransferencia:
                document.getElementById("nTransferencia").value,

            importe:
                document.getElementById("importe").value,

            cuenta:
                document.getElementById("cuenta").value,

            estado:
                document.getElementById("estado").value,

            observacion:
                document.getElementById("observacion").value

        };

        const response = await fetch(
            `/api/orden_pago/${idOrden}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(datos)
            }
        );

        const resultado =
            await response.json();

        if (resultado.success) {

            // Abre el PDF actualizado
            window.open(
                `/orden_pago/pdf/${idOrden}`,
                "_blank"
            );

            alert(
                "Orden modificada correctamente."
            );

            // Recarga la tabla
            await cargarOrdenes();

            // Limpia formulario
            document
                .getElementById("formOrdenPago")
                .reset();

            // Limpia ID oculto
            document
                .getElementById("idOrden")
                .value = "";

            // Oculta cheque y transferencia
            document
                .getElementById("divCheque")
                .classList.add("d-none");

            document
                .getElementById("divTransferencia")
                .classList.add("d-none");

            // Habilita Guardar
            document
                .getElementById("btnGuardar")
                .disabled = false;

            // Deshabilita Modificar
            document
                .getElementById("btnModificar")
                .disabled = true;

            // Deshabilita Reimprimir
            document
                .getElementById("btnImprimir")
                .disabled = true;

        } else {

            alert(resultado.message);

        }

    } catch (error) {

        console.error(error);

        alert(
            "Error al modificar la orden."
        );

    }

}
// ---------------------- Cerrar el modal y reseterar -------------------------------------------
const modalOrdenPago =
    document.getElementById("ordenPagoModal");

modalOrdenPago.addEventListener(
    "hidden.bs.modal",
    function () {

        document
            .getElementById("formOrdenPago")
            .reset();

        document
            .getElementById("idOrden")
            .value = "";

        document
            .querySelectorAll("#tablaOrdenes tbody tr")
            .forEach(tr => tr.classList.remove("table-primary"));

        document
            .getElementById("btnGuardar")
            .disabled = false;

        document
            .getElementById("btnModificar")
            .disabled = true;

        document
            .getElementById("btnImprimir")
            .disabled = true;

    }
);

//---------------------------- FILTRO PARA ORDENES EMITIDAS ------------------------------------
function filtrarTablaOrdenes() {

    const texto =
        document
            .getElementById("buscarOrden")
            .value
            .toLowerCase();

    const filas =
        document.querySelectorAll(
            "#tablaOrdenes tbody tr"
        );

    filas.forEach(fila => {

        const contenido =
            fila.textContent.toLowerCase();

        if (contenido.includes(texto)) {

            fila.style.display = "";

        } else {

            fila.style.display = "none";

        }

    });

}

document.addEventListener("DOMContentLoaded", () => {

    cargarOrdenes();

    document
        .getElementById("btnModificar")
        .addEventListener("click", modificarOrden);
        

});


