// ==========================================
// CREAR RESULTADO
// ==========================================

function crearResultado(
    tipo,
    campo,
    valorEncontrado,
    valorEsperado,
    mensaje
) {
    return {
        tipo,
        campo,
        valorEncontrado,
        valorEsperado,
        mensaje
    };
}


// ==========================================
// CONVERTIR VALOR A NÚMERO
// ==========================================

function numero(valor) {

    const resultado = Number(valor);

    return Number.isFinite(resultado)
        ? resultado
        : 0;

}


// ==========================================
// NORMALIZAR FORMA DE PAGO
// ==========================================

function normalizarFormaPago(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return null;
    }

    return String(valor).padStart(2, "0");

}


// ==========================================
// OBTENER TOTAL EN MXN
// ==========================================

function obtenerTotalMXN(factura) {

    const comprobante =
        factura.comprobante || {};

    const total =
        numero(
            comprobante.total
        );

    const moneda =
        String(
            comprobante.moneda || ""
        ).trim().toUpperCase();

    const tipoCambio =
        numero(
            comprobante.tipoCambio
        );


    // --------------------------------------
    // MXN
    // --------------------------------------

    if (
        moneda === "" ||
        moneda === "MXN"
    ) {
        return total;
    }


    // --------------------------------------
    // USD
    // --------------------------------------

    if (
        moneda === "USD" &&
        tipoCambio > 0
    ) {
        return total * tipoCambio;
    }


    // --------------------------------------
    // OTRAS MONEDAS
    // --------------------------------------

    return total;

}


// ==========================================
// BUSCAR RETENCIÓN
// ==========================================

function buscarRetencion(
    concepto,
    impuesto,
    tasaEsperada
) {

    const retenciones =
        concepto?.impuestos?.retenciones || [];


    return retenciones.find(
        retencion => {

            const impuestoCorrecto =
                String(retencion.impuesto) ===
                String(impuesto);


            const tasa =
                numero(
                    retencion.tasaOCuota
                );


            const tasaCorrecta =
                Math.abs(
                    tasa - tasaEsperada
                ) < 0.000001;


            return (
                impuestoCorrecto &&
                tasaCorrecta
            );

        }
    );

}


// ==========================================
// BUSCAR TRASLADO
// ==========================================

function buscarTraslado(
    concepto,
    impuesto
) {

    const traslados =
        concepto?.impuestos?.traslados || [];


    return traslados.find(
        traslado =>
            String(
                traslado.impuesto
            ) === String(impuesto)
    );

}


// ==========================================
// VALIDAR FACTURA
// ==========================================

function validarFactura(
    factura,
    opciones = {}
) {

    // ======================================
    // OPCIONES
    // ======================================

    const modoAlmacen =
        opciones.modoAlmacen === true;


    const errores = [];

    const revisiones = [];


    // ==========================================
    // DATOS GENERALES
    // ==========================================

    const receptor =
        factura.receptor || {};

    const comprobante =
        factura.comprobante || {};

    const emisor =
        factura.emisor || {};

    const conceptos =
        Array.isArray(factura.conceptos)
            ? factura.conceptos
            : [];


    const metodoPago =
        comprobante.metodoPago;


    const formaPago =
        normalizarFormaPago(
            comprobante.formaPago
        );


    // ==========================================
    // REGLA 1
    // CÓDIGO POSTAL DEL RECEPTOR
    // ==========================================

    if (
        String(
            receptor.codigoPostal
        ) !== "33116"
    ) {

        errores.push(
            crearResultado(

                "error",

                "Código postal del receptor",

                receptor.codigoPostal,

                "33116",

                "El código postal del receptor debe ser 33116."

            )
        );

    }


    // ==========================================
    // REGLA 2
    // RÉGIMEN FISCAL DEL RECEPTOR
    // ==========================================

    if (
        String(
            receptor.regimenFiscal
        ) !== "601"
    ) {

        errores.push(
            crearResultado(

                "error",

                "Régimen fiscal del receptor",

                receptor.regimenFiscal,

                "601",

                "El régimen fiscal del receptor debe ser 601."

            )
        );

    }


    // ==========================================
    // REGLA 3
    // MÉTODO Y FORMA DE PAGO
    // ==========================================

    const totalMXN =
        obtenerTotalMXN(
            factura
        );


    // ==========================================
    // PPD
    // FORMA DE PAGO 99
    // ==========================================

    if (
        metodoPago === "PPD"
    ) {

        if (
            formaPago !== "99"
        ) {

            errores.push(
                crearResultado(

                    "error",

                    "Forma de pago",

                    formaPago,

                    "99",

                    "Para método PPD la forma de pago debe ser 99."

                )
            );

        }

    }


    // ==========================================
    // PUE
    // FORMA DE PAGO SEGÚN TOTAL
    // ==========================================

    if (
        metodoPago === "PUE"
    ) {

        let formasPagoPermitidas;


        if (
            totalMXN < 2000
        ) {

            formasPagoPermitidas = [

                "01",
                "02",
                "03",
                "04",
                "28"

            ];

        } else {

            formasPagoPermitidas = [

                "02",
                "03",
                "04",
                "28"

            ];

        }


        if (
            !formasPagoPermitidas.includes(
                formaPago
            )
        ) {

            errores.push(
                crearResultado(

                    "error",

                    "Forma de pago",

                    formaPago,

                    formasPagoPermitidas.join(", "),

                    totalMXN < 2000

                        ? "Para facturas PUE menores a $2,000 MXN se permiten únicamente las formas de pago 01, 02, 03, 04 y 28."

                        : "Para facturas PUE de $2,000 MXN o más se permiten únicamente las formas de pago 02, 03, 04 y 28."

                )
            );

        }

    }


    // ==========================================
    // REGLA 6
    // OBJETO DE IMPUESTO
    // ==========================================

    conceptos.forEach(
        (concepto, index) => {

            const objetoImp =
                concepto.objetoImp;


            const sinObjetoImp =
                objetoImp === null ||
                objetoImp === undefined ||
                String(objetoImp).trim() === "";


            if (
                sinObjetoImp
            ) {

                errores.push(
                    crearResultado(

                        "error",

                        `Objeto de impuesto - Concepto ${index + 1}`,

                        objetoImp,

                        "Debe existir un ObjetoImp",

                        "El concepto no debe quedar sin objeto de impuesto. El XML debe indicar el valor correspondiente en ObjetoImp."

                    )
                );

            }

        }
    );


    // ==========================================
    // REGLA 7
    // RESICO 626
    // RETENCIÓN ISR 1.25%
    // ==========================================

    const rfcEmisor =
        String(
            emisor.rfc || ""
        )
        .trim()
        .toUpperCase();


    const regimenEmisor =
        String(
            emisor.regimenFiscal || ""
        )
        .trim();


    const longitudRFC =
        rfcEmisor.length;


    const esPersonaFisica =
        longitudRFC === 13;


    const esPersonaMoral =
        longitudRFC === 12;


    const aplicaRESICO =
        regimenEmisor === "626" &&
        esPersonaFisica;


    // Evitamos advertencias de variable no utilizada.
    void esPersonaMoral;


    if (
        aplicaRESICO
    ) {

        conceptos.forEach(
            (concepto, index) => {

                // --------------------------------------
                // RETENCIÓN ISR
                // --------------------------------------

                const retencionISR =
                    buscarRetencion(
                        concepto,
                        "001",
                        0.0125
                    );


                if (
                    !retencionISR
                ) {

                    errores.push(
                        crearResultado(

                            "error",

                            `Retención ISR - Concepto ${index + 1}`,

                            "No encontrada",

                            "Impuesto 001 / Tasa 0.012500",

                            "Cuando el emisor es persona física con régimen fiscal 626 (RESICO), debe existir una retención de ISR del 1.25%."

                        )
                    );

                }


                // --------------------------------------
                // IMPORTE ISR
                // --------------------------------------

                if (
                    retencionISR
                ) {

                    const base =
                        numero(
                            retencionISR.base ??
                            concepto.importe
                        );


                    const importeEsperado =
                        base * 0.0125;


                    const importeEncontrado =
                        numero(
                            retencionISR.importe
                        );


                    const diferencia =
                        Math.abs(
                            importeEncontrado -
                            importeEsperado
                        );


                    if (
                        diferencia > 0.01
                    ) {

                        errores.push(
                            crearResultado(

                                "error",

                                `Importe ISR RESICO - Concepto ${index + 1}`,

                                importeEncontrado,

                                Number(
                                    importeEsperado.toFixed(2)
                                ),

                                "El importe de la retención ISR RESICO debe corresponder al 1.25% de la base del concepto."

                            )
                        );

                    }

                }


                // --------------------------------------
                // IVA
                // --------------------------------------

                const trasladoIVA =
                    buscarTraslado(
                        concepto,
                        "002"
                    );


                if (
                    !trasladoIVA
                ) {

                    revisiones.push(
                        crearResultado(

                            "advertencia",

                            `IVA - Concepto ${index + 1}`,

                            "No encontrado",

                            "Traslado IVA 002",

                            "El concepto pertenece a un emisor RESICO y no contiene traslado de IVA. Revisar si la operación corresponde correctamente a una factura sin IVA."

                        )
                    );

                }

            }
        );

    }


    // ==========================================
    // REGLA 8
    // CARTA PORTE + POSIBLE TRANSPORTE
    // REVISIÓN MANUAL IVA 4%
    // ==========================================

    const tieneCartaPorte =
        factura.complementos?.cartaPorte === true;


    if (
        tieneCartaPorte
    ) {

        let conceptoTransporte = null;


        conceptos.forEach(
            concepto => {

                if (
                    conceptoTransporte
                ) {
                    return;
                }


                const descripcion =
                    String(
                        concepto?.descripcion || ""
                    )
                    .toUpperCase()
                    .normalize("NFD")
                    .replace(
                        /[\u0300-\u036f]/g,
                        ""
                    );


                const claveProdServ =
                    String(
                        concepto?.claveProdServ || ""
                    );


                const palabrasTransporte = [

                    "FLETE",
                    "TRANSPORTE",
                    "TRANSPORTACION",
                    "CARGA",
                    "FERROCARRIL",
                    "LOGISTICA",
                    "AUTOTRANSPORTE",
                    "SERVICIO DE TRANSPORTE",
                    "SERVICIO TRANSPORTE"

                ];


                const contienePalabraTransporte =
                    palabrasTransporte.some(
                        palabra =>
                            descripcion.includes(
                                palabra
                            )
                    );


                const clavesTransporte = [

                    "78101600",
                    "78101601",
                    "78101602",
                    "78101603",
                    "78101604",
                    "78101605",
                    "78101606",
                    "78101607",
                    "78101608",
                    "78101609",
                    "78121603"

                ];


                const contieneClaveTransporte =
                    clavesTransporte.includes(
                        claveProdServ
                    );


                if (
                    contienePalabraTransporte ||
                    contieneClaveTransporte
                ) {

                    conceptoTransporte =
                        concepto;

                }

            }
        );


        // --------------------------------------
        // ENCONTRÓ TRANSPORTE
        // --------------------------------------

        if (
            conceptoTransporte
        ) {

            const retencionIVA =
                buscarRetencion(
                    conceptoTransporte,
                    "002",
                    0.04
                );


            if (
                !retencionIVA
            ) {

                revisiones.push(
                    crearResultado(

                        "revision",

                        "REVISIÓN MANUAL - Carta Porte / Transporte",

                        conceptoTransporte.descripcion,

                        "Retención IVA 4%",

                        "La factura contiene Carta Porte y el concepto podría corresponder a un servicio de transporte. Revisar manualmente si corresponde aplicar una retención de IVA del 4%."

                    )
                );

            }

        }


        // --------------------------------------
        // NO ENCONTRÓ TRANSPORTE
        // --------------------------------------

        else {

            revisiones.push(
                crearResultado(

                    "revision",

                    "REVISIÓN MANUAL - Carta Porte",

                    "Carta Porte detectada",

                    "Revisar transporte y retención IVA 4%",

                    "La factura contiene un complemento Carta Porte, pero no fue posible identificar claramente el concepto de transporte por su descripción o ClaveProdServ. Revisar manualmente si corresponde retención de IVA del 4%."

                )
            );

        }

    }


    // ==========================================
    // REGLA 9
    // TIPO INTERNO SEGÚN USO CFDI Y MODO
    // ==========================================

    const usoCFDI =
        String(
            receptor.usoCFDI || ""
        )
        .trim()
        .toUpperCase();


    // ------------------------------------------
    // MODO ALMACÉN ACTIVADO
    // ------------------------------------------

    if (
        modoAlmacen
    ) {

        if (
            usoCFDI !== "G01"
        ) {

            errores.push(
                crearResultado(

                    "error",

                    "Uso CFDI / Tipo interno",

                    usoCFDI || "No encontrado",

                    "G01 → Tipo P",

                    "El Modo Adquisición de Mercancias está activado. La factura debe utilizar Uso CFDI G01 (Adquisición de mercancías), correspondiente al tipo interno P."

                )
            );

        }

    }


    // ------------------------------------------
    // MODO ALMACÉN DESACTIVADO
    // ------------------------------------------

    else {

        if (
            usoCFDI !== "G03"
        ) {

            errores.push(
                crearResultado(

                    "error",

                    "Uso CFDI / Tipo interno",

                    usoCFDI || "No encontrado",

                    "G03 → Tipo A",

                    "El Modo Adquisición de Mercancias está desactivado. La factura debe utilizar Uso CFDI G03 (Gastos en general), correspondiente al tipo interno A."

                )
            );

        }

    }


    // ==========================================
    // REGLA 10
    // USO CFDI I01
    // ==========================================

    if (
        usoCFDI === "I01"
    ) {

        revisiones.push(
            crearResultado(

                "revision",

                "Uso CFDI I01",

                "I01",

                "Entrada activo fijo",

                "El uso CFDI I01 (Activos fijos) requiere revisar que la factura se haya capturado únicamente mediante Compras → Entrada activo fijo."

            )
        );

    }


    // ==========================================
    // RESULTADO
    // ==========================================

    return {

        correcto:
            errores.length === 0,

        errores,

        revisiones

    };

}


// ==========================================
// EXPORTAR
// ==========================================

module.exports = {
    validarFactura
};