document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formCajaChica");
    if (!form) return;

    const idCajaInput = document.getElementById("idCaja");
    const fechaInput = document.getElementById("fechaCaja");
    const proveedorInput = document.getElementById("proveedorCaja");
    const comprobanteInput = document.getElementById("comprobanteCaja");
    const importeInput = document.getElementById("importeCaja");
    const conceptoInput = document.getElementById("conceptoCaja");

    const btnGuardar = document.getElementById("btnGuardarCaja");
    const btnModificar = document.getElementById("btnModificarCaja");
    const btnEliminar = document.getElementById("btnEliminarCaja");
    const btnLimpiar = document.getElementById("btnLimpiarCaja");
    const badgeModo = document.getElementById("badgeModoCaja");

    const buscarInput = document.getElementById("buscarCaja");
    const filtroFechaInput = document.getElementById("filtroFechaCaja");
    const tabla = document.getElementById("tablaCajaChica");
    const totalFiltradoEl = document.getElementById("totalFiltradoCaja");
    const totalGeneralEl = document.getElementById("totalGeneralCaja");

    const fechaDiariaInput = document.getElementById("fechaDiariaCaja");
    const btnConsultarDiaria = document.getElementById("btnConsultarDiaria");
    const tbodyIngresos = document.querySelector("#tablaDiariaIngresos tbody");
    const tbodyEgresos = document.querySelector("#tablaDiariaEgresos tbody");
    const totalIngresosEl = document.getElementById("resumenTotalIngresos");
    const totalEgresosEl = document.getElementById("resumenTotalEgresos");

    function formatoMoneda(valor) {
        const num = parseFloat(valor || 0);
        return `$${(isNaN(num) ? 0 : num).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    function actualizarTotales() {
        let totalGeneral = 0;
        let totalFiltrado = 0;

        tabla.querySelectorAll("tbody tr").forEach(fila => {
            const monto = parseFloat(fila.dataset.importe || "0");
            if (!isNaN(monto)) {
                totalGeneral += monto;
                if (fila.style.display !== "none") {
                    totalFiltrado += monto;
                }
            }
        });

        totalGeneralEl.textContent = formatoMoneda(totalGeneral);
        totalFiltradoEl.textContent = formatoMoneda(totalFiltrado);
    }

    function filtrarTabla() {
        const texto = buscarInput.value.toLowerCase().trim();
        const fechaFiltro = filtroFechaInput.value.trim();

        tabla.querySelectorAll("tbody tr").forEach(fila => {
            const contenido = fila.textContent.toLowerCase();
            const filaFecha = (fila.dataset.fecha || "").trim();

            const coincideTexto = !texto || contenido.includes(texto);
            const coincideFecha = !fechaFiltro || filaFecha === fechaFiltro;

            fila.style.display = (coincideTexto && coincideFecha) ? "" : "none";
        });

        actualizarTotales();
    }

    buscarInput.addEventListener("input", filtrarTabla);
    filtroFechaInput.addEventListener("change", filtrarTabla);

    function limpiarFormulario() {
        const fechaBase = fechaInput.defaultValue;
        form.reset();
        fechaInput.value = fechaBase;
        idCajaInput.value = "";

        btnGuardar.disabled = false;
        btnModificar.disabled = true;
        btnEliminar.disabled = true;

        badgeModo.textContent = "Nuevo Registro";
        badgeModo.className = "badge bg-warning-subtle text-dark border border-warning";

        tabla.querySelectorAll("tbody tr").forEach(tr => tr.classList.remove("table-active"));
    }

    btnLimpiar.addEventListener("click", limpiarFormulario);

    function asignarEventosFilas() {
        tabla.querySelectorAll("tbody tr").forEach(fila => {
            fila.addEventListener("click", () => {
                tabla.querySelectorAll("tbody tr").forEach(tr => tr.classList.remove("table-active"));
                fila.classList.add("table-active");

                idCajaInput.value = fila.dataset.id;
                fechaInput.value = fila.dataset.fecha;
                proveedorInput.value = fila.dataset.proveedor;
                comprobanteInput.value = fila.dataset.comprobante;
                importeInput.value = parseFloat(fila.dataset.importe).toFixed(2);
                conceptoInput.value = fila.dataset.concepto;

                btnGuardar.disabled = true;
                btnModificar.disabled = false;
                btnEliminar.disabled = false;

                badgeModo.textContent = `Editando ID #${fila.dataset.id}`;
                badgeModo.className = "badge bg-primary-subtle text-primary border border-primary-subtle";
            });
        });
    }

    async function recargarTabla() {
        const res = await fetch("/api/caja-chica");
        const datos = await res.json();
        const tbody = tabla.querySelector("tbody");
        tbody.innerHTML = "";

        datos.forEach(item => {
            const tr = document.createElement("tr");
            tr.dataset.id = item.id_caja;
            tr.dataset.fecha = item.fecha;
            tr.dataset.proveedor = item.proveedor;
            tr.dataset.concepto = item.concepto;
            tr.dataset.comprobante = item.comprobante;
            tr.dataset.importe = item.importe;

            tr.innerHTML = `
                <td>${item.id_caja}</td>
                <td>${item.fecha}</td>
                <td class="fw-medium">${item.proveedor}</td>
                <td>${item.concepto}</td>
                <td><span class="badge bg-secondary-subtle text-dark">#${item.comprobante}</span></td>
                <td class="text-end fw-bold text-dark">${formatoMoneda(item.importe)}</td>
            `;
            tbody.appendChild(tr);
        });

        asignarEventosFilas();
        filtrarTabla();
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const payload = {
            fecha: fechaInput.value,
            proveedor: proveedorInput.value,
            comprobante: comprobanteInput.value,
            importe: importeInput.value,
            concepto: conceptoInput.value,
        };

        const res = await fetch("/api/caja-chica", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || "Error al guardar el registro.");
            return;
        }

        limpiarFormulario();
        await recargarTabla();
    });

    btnModificar.addEventListener("click", async () => {
        const idCaja = idCajaInput.value;
        if (!idCaja) return;

        const payload = {
            fecha: fechaInput.value,
            proveedor: proveedorInput.value,
            comprobante: comprobanteInput.value,
            importe: importeInput.value,
            concepto: conceptoInput.value,
        };

        const res = await fetch(`/api/caja-chica/${idCaja}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || "Error al modificar el registro.");
            return;
        }

        limpiarFormulario();
        await recargarTabla();
    });

    btnEliminar.addEventListener("click", async () => {
        const idCaja = idCajaInput.value;
        if (!idCaja) return;
        if (!confirm(`¿Seguro que desea eliminar el movimiento #${idCaja}?`)) return;

        const res = await fetch(`/api/caja-chica/${idCaja}`, { method: "DELETE" });
        const data = await res.json();

        if (!res.ok || !data.success) {
            alert(data.message || "Error al eliminar el registro.");
            return;
        }

        limpiarFormulario();
        await recargarTabla();
    });

    async function cargarPlanillaDiaria() {
        const fecha = fechaDiariaInput.value;
        if (!fecha) return;

        const res = await fetch(`/api/caja-chica/diaria?fecha=${encodeURIComponent(fecha)}`);
        const data = await res.json();
        if (!res.ok || !data.success) return;

        tbodyIngresos.innerHTML = "";
        (data.ingresos || []).forEach(row => {
            tbodyIngresos.innerHTML += `
                <tr>
                    <td>#${row.comprobante}</td>
                    <td>${row.concepto}</td>
                    <td class="text-end">${formatoMoneda(row.importe)}</td>
                </tr>
            `;
        });

        tbodyEgresos.innerHTML = "";
        (data.egresos || []).forEach(row => {
            tbodyEgresos.innerHTML += `
                <tr>
                    <td>#${row.comprobante}</td>
                    <td>${row.concepto}</td>
                    <td class="text-end">${formatoMoneda(row.importe)}</td>
                </tr>
            `;
        });

        totalIngresosEl.textContent = formatoMoneda(data.total_ingresos);
        totalEgresosEl.textContent = formatoMoneda(data.total_egresos);
    }

    btnConsultarDiaria?.addEventListener("click", cargarPlanillaDiaria);

    asignarEventosFilas();
    actualizarTotales();
    cargarPlanillaDiaria();
});