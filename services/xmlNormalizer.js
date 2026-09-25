function normalizarFactura(objetoXML, nombreArchivo) {

    const comprobante = objetoXML?.Comprobante;

    if (!comprobante) {

        throw new Error(
            "No se encontró el nodo Comprobante en el XML."
        );

    }


    const emisor =
        comprobante.Emisor || {};

    const receptor =
        comprobante.Receptor || {};

    const conceptosNodo =
        comprobante.Conceptos?.Concepto;


    // ==========================================
    // CONCEPTOS
    // ==========================================

    let conceptos = [];

    if (conceptosNodo) {

        conceptos =
            Array.isArray(conceptosNodo)
                ? conceptosNodo
                : [conceptosNodo];

    }


    // ==========================================
    // COMPLEMENTO
    // ==========================================

    const complemento =
        comprobante.Complemento || {};


    /*
     * Carta Porte puede aparecer como:
     *
     * CartaPorte
     * CartaPorte20
     * CartaPorte30
     * CartaPorte31
     *
     * dependiendo de la versión.
     */

    const nombresComplementos =
        Object.keys(complemento);


    const nombreCartaPorte =
        nombresComplementos.find(
            nombre =>
                nombre
                    .toLowerCase()
                    .startsWith("cartaporte")
        );


    const tieneCartaPorte =
        Boolean(nombreCartaPorte);


    // ==========================================
    // NORMALIZAR CONCEPTOS
    // ==========================================

    const conceptosNormalizados =
        conceptos.map((concepto) => {

            const impuestos =
                concepto.Impuestos || {};


            // --------------------------------------
            // TRASLADOS
            // --------------------------------------

            const trasladosNodo =
                impuestos.Traslados?.Traslado;


            let traslados = [];


            if (trasladosNodo) {

                traslados =
                    Array.isArray(trasladosNodo)
                        ? trasladosNodo
                        : [trasladosNodo];

            }


            // --------------------------------------
            // RETENCIONES
            // --------------------------------------

            const retencionesNodo =
                impuestos.Retenciones?.Retencion;


            let retenciones = [];


            if (retencionesNodo) {

                retenciones =
                    Array.isArray(retencionesNodo)
                        ? retencionesNodo
                        : [retencionesNodo];

            }


            // --------------------------------------
            // CONCEPTO NORMALIZADO
            // --------------------------------------

            return {

                claveProdServ:
                    concepto["@_ClaveProdServ"] ?? null,

                noIdentificacion:
                    concepto["@_NoIdentificacion"] ?? null,

                cantidad:
                    concepto["@_Cantidad"] ?? null,

                claveUnidad:
                    concepto["@_ClaveUnidad"] ?? null,

                unidad:
                    concepto["@_Unidad"] ?? null,

                descripcion:
                    concepto["@_Descripcion"] ?? null,

                valorUnitario:
                    concepto["@_ValorUnitario"] ?? null,

                importe:
                    concepto["@_Importe"] ?? null,

                objetoImp:
                    concepto["@_ObjetoImp"] ?? null,


                impuestos: {

                    // ----------------------------------
                    // TRASLADOS
                    // ----------------------------------

                    traslados:
                        traslados.map(
                            (traslado) => ({

                                impuesto:
                                    traslado["@_Impuesto"] ?? null,

                                tipoFactor:
                                    traslado["@_TipoFactor"] ?? null,

                                tasaOCuota:
                                    traslado["@_TasaOCuota"] ?? null,

                                base:
                                    traslado["@_Base"] ?? null,

                                importe:
                                    traslado["@_Importe"] ?? null

                            })
                        ),


                    // ----------------------------------
                    // RETENCIONES
                    // ----------------------------------

                    retenciones:
                        retenciones.map(
                            (retencion) => ({

                                impuesto:
                                    retencion["@_Impuesto"] ?? null,

                                tipoFactor:
                                    retencion["@_TipoFactor"] ?? null,

                                tasaOCuota:
                                    retencion["@_TasaOCuota"] ?? null,

                                base:
                                    retencion["@_Base"] ?? null,

                                importe:
                                    retencion["@_Importe"] ?? null

                            })
                        )

                }

            };

        });


    // ==========================================
    // FACTURA NORMALIZADA
    // ==========================================

    const factura = {

        archivo:
            nombreArchivo,


        // ========================================
        // COMPROBANTE
        // ========================================

        comprobante: {

            version:
                comprobante["@_Version"] ?? null,

            serie:
                comprobante["@_Serie"] ?? null,

            folio:
                comprobante["@_Folio"] ?? null,

            fecha:
                comprobante["@_Fecha"] ?? null,

            subtotal:
                comprobante["@_SubTotal"] ?? null,

            total:
                comprobante["@_Total"] ?? null,

            moneda:
                comprobante["@_Moneda"] ?? null,

            tipoCambio:
                comprobante["@_TipoCambio"] ?? null,

            tipoComprobante:
                comprobante["@_TipoDeComprobante"] ?? null,

            metodoPago:
                comprobante["@_MetodoPago"] ?? null,

            formaPago:
                comprobante["@_FormaPago"] ?? null,

            lugarExpedicion:
                comprobante["@_LugarExpedicion"] ?? null

        },


        // ========================================
        // EMISOR
        // ========================================

        emisor: {

            rfc:
                emisor["@_Rfc"] ?? null,

            nombre:
                emisor["@_Nombre"] ?? null,

            regimenFiscal:
                emisor["@_RegimenFiscal"] ?? null

        },


        // ========================================
        // RECEPTOR
        // ========================================

        receptor: {

            rfc:
                receptor["@_Rfc"] ?? null,

            nombre:
                receptor["@_Nombre"] ?? null,

            codigoPostal:
                receptor["@_DomicilioFiscalReceptor"] ?? null,

            regimenFiscal:
                receptor["@_RegimenFiscalReceptor"] ?? null,

            usoCFDI:
                receptor["@_UsoCFDI"] ?? null

        },


        // ========================================
        // CONCEPTOS
        // ========================================

        conceptos:
            conceptosNormalizados,


        // ========================================
        // COMPLEMENTOS
        // ========================================

        complementos: {

            cartaPorte:
                tieneCartaPorte,

            cartaPorteVersion:
                nombreCartaPorte || null

        }

    };


    return factura;

}


module.exports = {
    normalizarFactura
};