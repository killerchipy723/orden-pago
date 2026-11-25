document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formRecaudacion");
    if (!form) return;

    const idRecInput = document.getElementById("idRecaudacion");
    const fechaInput = document.getElementById("fechaRec");
    const nReciboInput = document.getElementById("nRecibo");
    const contribSearchInput = document.getElementById("buscarContribuyenteInput");
    const idContribInput = document.getElementById("idContribuyenteRec");
    const listaContrib = document.getElementById("listaContribuyentes");
    const conceptoSelect = document.getElementById("idConceptoRec");
    const montoInput = document.getElementById("montoRec");
    const modoPagoSelect = document.getElementById("modoPagoRec");

    const btnGuardar = document.getElementById("btnGuardarRec");
    const btnModificar = document.getElementById("btnModificarRec");
    const btnEliminar = document.getElementById("btnEliminarRec");
    const btnLimpiar = document.getElementById("btnLimpiarRec");
    const badgeModo = document.getElementById("badgeModoRecaudacion");

    const buscarTablaInput = document.getElementById("buscarRecaudacion");
    const filtroModoSelect = document.getElementById("filtroModoRec");
    const tabla = document.getElementById("tablaRecaudaciones");
    const totalTexto = document.getElementById("totalRecaudadoTexto");

    // Sincronizar texto del datalist con el ID real del contribuyente
    function resolverIdContribuyente() {
        const valor = contribSearchInput.value.trim().toUpperCase();
        const opciones = listaContrib.querySelectorAll("option");
        let encontrado = "";

        opciones.forEach(opt => {
            if (opt.value.trim().toUpperCase() === valor) {
                encontrado = opt.dataset.id;
            }
        });

        idContribInput.value = encontrado;
        return encontrado;
    }

    contribSearchInput.addEventListener("input", resolverIdContribuyente);
    contribSearchInput.addEventListener("change", resolverIdContribuyente);

    // Calcular total visible en la tabla
    function actualizarTotalVisible() {
        let total = 0;
        const filas = tabla.querySelectorAll("tbody tr");
        filas.forEach(fila => {
            if (fila.style.display !== "none") {
                const monto = parseFloat(fila.dataset.monto || "0");
                if (!isNaN(monto)) total += monto;
            }
        });
        totalTexto.textContent = `$${total.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }

    // Filtrar tabla por texto y modo de pago
    function filtrarTabla() {
        const texto = buscarTablaInput.value.toLowerCase().trim();
        const modo = filtroModoSelect.value.toLowerCase().trim();
        const filas = tabla.querySelectorAll("tbody tr");

        filas.forEach(fila => {
            const contenido = fila.textContent.toLowerCase();
            const filaModo = (fila.dataset.modopago || "").toLowerCase();
            const coincideTexto = !texto || contenido.includes(texto);
            const coincideModo = !modo || filaModo === modo;

            fila.style.display = (coincideTexto && coincideModo) ? "" : "none";
        });

        actualizarTotalVisible();
    }

    buscarTablaInput.addEventListener("input", filtrarTabla);
    filtroModoSelect.addEventListener("change", filtrarTabla);

    // Limpiar formulario
    function limpiarFormulario() {
        const fechaActual = fechaInput.defaultValue;
        form.reset();
        fechaInput.value = fechaActual;
        idRecInput.value = "";
        idContribInput.value = "";

        btnGuardar.disabled = false;
        btnModificar.disabled = true;
        btnEliminar.disabled = true;

        badgeModo.textContent = "Nuevo Registro";
        badgeModo.className = "badge bg-success-subtle text-success border border-success-subtle";

        tabla.querySelectorAll("tbody tr").forEach(tr => tr.classList.remove("table-active"));
    }

    btnLimpiar.addEventListener("click", limpiarFormulario);

    // Seleccionar fila para editar/eliminar
    function asignarEventosFilas() {
        tabla.querySelectorAll("tbody tr").forEach(fila => {
            fila.addEventListener("click", () => {
                tabla.querySelectorAll("tbody tr").forEach(tr => tr.classList.remove("table-active"));
                fila.classList.add("table-active");

                idRecInput.value = fila.dataset.id;
                fechaInput.value = fila.dataset.fecha;
                nReciboInput.value = fila.dataset.nrecibo;
                idContribInput.value = fila.dataset.idcontribuyente;
                contribSearchInput.value = fila.dataset.contribuyente;
                conceptoSelect.value = fila.dataset.idconcepto;
                modoPagoSelect.value = fila.dataset.modopago;
                montoInput.value = parseFloat(fila.dataset.monto).toFixed(2);

                btnGuardar.disabled = true;
                btnModificar.disabled = false;
                btnEliminar.disabled = false;

                badgeModo.textContent = `Editando ID #${fila.dataset.id}`;
                badgeModo.className = "badge bg-warning-subtle text-dark border border-warning";
            });
        });
    }

    // Recargar tabla desde API sin recargar la página
    async function recargarTabla() {
        const res = await fetch("/api/recaudaciones");
        const datos = await res.json();
        const tbody = tabla.querySelector("tbody");
        tbody.innerHTML = "";

        datos.forEach(r => {
            const tr = document.createElement("tr");
            tr.dataset.id = r.idrecaudacion;
            tr.dataset.fecha = r.fecha;
            tr.dataset.nrecibo = r.nrecibo;
            tr.dataset.idcontribuyente = r.idcontribuyente;
            tr.dataset.contribuyente = `${r.contribuyente} - DNI ${r.dni}`;
            tr.dataset.idconcepto = r.idconcepto;
            tr.dataset.modopago = r.modopago;
            tr.dataset.monto = r.monto;

            tr.innerHTML = `
                <td>${r.idrecaudacion}</td>
                <td>${r.fecha}</td>
                <td><span class="badge bg-secondary-subtle text-dark">#${r.nrecibo}</span></td>
                <td class="fw-medium">${r.contribuyente}</td>
                <td>${r.concepto}</td>
                <td>${r.modopago}</td>
                <td class="text-end fw-bold text-success">$${parseFloat(r.monto).toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });

        asignarEventosFilas();
        filtrarTabla();
    }

    // Guardar nueva recaudación
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const idContrib = resolverIdContribuyente() || idContribInput.value;

        if (!idContrib) {
            alert("Seleccione un contribuyente válido de la lista o regístrelo con el botón +.");
            contribSearchInput.focus();
            return;
        }

        const payload = {
            fecha: fechaInput.value,
            nrecibo: nReciboInput.value,
            idcontribuyente: idContrib,
            idconcepto: conceptoSelect.value,
            monto: montoInput.value,
            modopago: modoPagoSelect.value
        };

        const res = await fetch("/api/recaudaciones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || "Error al guardar la recaudación.");
            return;
        }

        limpiarFormulario();
        await recargarTabla();
    });

    // Modificar recaudación existente
    btnModificar.addEventListener("click", async () => {
        const idRec = idRecInput.value;
        const idContrib = resolverIdContribuyente() || idContribInput.value;
        if (!idRec || !idContrib) return;

        const payload = {
            fecha: fechaInput.value,
            nrecibo: nReciboInput.value,
            idcontribuyente: idContrib,
            idconcepto: conceptoSelect.value,
            monto: montoInput.value,
            modopago: modoPagoSelect.value
        };

        const res = await fetch(`/api/recaudaciones/${idRec}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || "Error al modificar la recaudación.");
            return;
        }

        limpiarFormulario();
        await recargarTabla();
    });

    // Eliminar recaudación
    btnEliminar.addEventListener("click", async () => {
        const idRec = idRecInput.value;
        if (!idRec) return;

        if (!confirm(`¿Seguro que desea eliminar la recaudación #${idRec}?`)) return;

        const res = await fetch(`/api/recaudaciones/${idRec}`, { method: "DELETE" });
        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || "Error al eliminar.");
            return;
        }

        limpiarFormulario();
        await recargarTabla();
    });

    // Alta rápida de contribuyente
    document.getElementById("btnGuardarContribuyente")?.addEventListener("click", async () => {
        const apellido = document.getElementById("apellidoContrib").value.trim();
        const nombre = document.getElementById("nombreContrib").value.trim();
        const dni = document.getElementById("dniContrib").value.trim();

        const res = await fetch("/api/contribuyentes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apellido, nombre, dni })
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || "Error al guardar contribuyente.");
            return;
        }

        const opt = document.createElement("option");
        opt.dataset.id = data.contribuyente.idcontribuyente;
        opt.value = `${data.contribuyente.apenomb} - DNI ${data.contribuyente.dni}`;
        listaContrib.appendChild(opt);

        idContribInput.value = data.contribuyente.idcontribuyente;
        contribSearchInput.value = opt.value;

        document.getElementById("formNuevoContribuyente").reset();
        bootstrap.Modal.getInstance(document.getElementById("modalNuevoContribuyente")).hide();
    });

    // Alta rápida de concepto de ingreso
    document.getElementById("btnGuardarConceptoIngreso")?.addEventListener("click", async () => {
        const detalle = document.getElementById("detalleConceptoIngreso").value.trim();

        const res = await fetch("/api/conceptos-ingreso", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ detalle })
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || "Error al guardar concepto.");
            return;
        }

        const option = new Option(data.concepto.detalle, data.concepto.idconcepto, true, true);
        conceptoSelect.add(option);

        document.getElementById("formConceptoIngreso").reset();
        bootstrap.Modal.getInstance(document.getElementById("modalConceptoIngreso")).hide();
    });

    asignarEventosFilas();
    actualizarTotalVisible();
});