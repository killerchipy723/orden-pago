document.addEventListener("DOMContentLoaded", function () {

        const importe = document.getElementById("importe");
        const cantidad = document.getElementById("cantidad");

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

