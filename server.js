const express = require("express");
const path = require("path");
const multer = require("multer");

// TODO: Importa aquí tus servicios personalizados (puedes ajustar las rutas según tu estructura)
const {
    parseXML
} = require("./services/xmlparser");

const {
    normalizarFactura
} = require("./services/xmlNormalizer");

const {
    validarFactura
} = require("./services/validator");


const app = express();

const PORT =
    Number.parseInt(
        process.env.PORT || "3001",
        10
    );

const HOST =
    process.env.HOST?.trim() ||
    "0.0.0.0";


if (
    !Number.isInteger(PORT) ||
    PORT < 1 ||
    PORT > 65535
) {

    throw new Error(
        "PORT debe ser un puerto valido entre 1 y 65535"
    );

}


// ==========================================
// CONFIGURACIÓN DE EJS
// ==========================================

app.set(
    "view engine",
    "ejs"
);

app.set(
    "views",
    path.join(
        __dirname,
        "views"
    )
);


// ==========================================
// ARCHIVOS PÚBLICOS
// ==========================================

app.use(
    express.static(
        path.join(
            __dirname,
            "public"
        )
    )
);


// ==========================================
// CONFIGURACIÓN DE MULTER
// ==========================================

const upload =
    multer({

        storage:
            multer.memoryStorage(),

        limits: {

            files: 1000,

            fileSize:
                10 * 1024 * 1024

        },

        fileFilter:
            (req, file, cb) => {

                const esXML =
                    file.originalname
                        .toLowerCase()
                        .endsWith(".xml");


                if (
                    esXML
                ) {

                    cb(
                        null,
                        true
                    );

                } else {

                    cb(
                        new Error(
                            "Solo se permiten archivos XML"
                        )
                    );

                }

            }

    });


// ==========================================
// PÁGINA PRINCIPAL / HEALTHCHECK
// ==========================================

app.get(
    "/health/live",
    (req, res) => {

        res.status(200).json({

            status:
                "ok",

            service:
                "validador-xml"

        });

    }
);


app.get(
    "/",
    (req, res) => {

        res.render(
            "index"
        );

    }
);


// ==========================================
// ANALIZAR XML
// ==========================================

app.post(

    "/analizar",

    upload.array(
        "xmlFiles",
        1000
    ),

    (req, res) => {

        console.log("");

        console.log(
            "================================"
        );

        console.log(
            "ANÁLISIS DE ARCHIVOS XML"
        );

        console.log(
            "================================"
        );


        // ======================================
        // ARCHIVOS
        // ======================================

        const archivos =
            Array.isArray(req.files)
                ? req.files
                : [];


        // ======================================
        // MODO ALMACÉN
        // ======================================

        const modoAlmacen =
            String(
                req.body.modoAlmacen || ""
            ).toLowerCase() === "true";


        console.log(
            `Modo Almacén: ${
                modoAlmacen
                    ? "ACTIVADO"
                    : "DESACTIVADO"
            }`
        );


        // ======================================
        // RESULTADOS
        // ======================================

        const resultados = [];


        // ======================================
        // PROCESAR ARCHIVOS
        // ======================================

        archivos.forEach(
            (file, index) => {

                console.log("");

                console.log(
                    `XML ${index + 1}: ${file.originalname}`
                );


                try {

                    // ==================================
                    // XML
                    // ==================================

                    const xml =
                        file.buffer.toString(
                            "utf-8"
                        );


                    // ==================================
                    // PARSEAR XML
                    // ==================================

                    const objetoXML =
                        parseXML(
                            xml
                        );


                    // ==================================
                    // NORMALIZAR
                    // ==================================

                    const factura =
                        normalizarFactura(
                            objetoXML,
                            file.originalname
                        );


                    // ==================================
                    // VALIDAR
                    // ==================================

                    const resultado =
                        validarFactura(
                            factura,
                            {
                                modoAlmacen
                            }
                        );


                    // ==================================
                    // GUARDAR RESULTADO
                    // ==================================

                    resultados.push({

                        archivo:
                            file.originalname,

                        factura,

                        correcto:
                            resultado.correcto,

                        errores:
                            resultado.errores,

                        revisiones:
                            resultado.revisiones

                    });


                    // ==================================
                    // LOG
                    // ==================================

                    console.log(
                        JSON.stringify(
                            resultado,
                            null,
                            2
                        )
                    );


                } catch (
                    error
                ) {

                    console.error(
                        `Error en ${file.originalname}:`
                    );

                    console.error(
                        error.message
                    );


                    // ==================================
                    // XML CON ERROR
                    // ==================================

                    resultados.push({

                        archivo:
                            file.originalname,

                        factura:
                            null,

                        correcto:
                            false,

                        errores: [

                            {

                                tipo:
                                    "error",

                                campo:
                                    "Archivo XML",

                                valorEncontrado:
                                    null,

                                valorEsperado:
                                    "XML válido",

                                mensaje:
                                    error.message

                            }

                        ],

                        revisiones:
                            []

                    });

                }

            }
        );


        // ==========================================
        // RESUMEN
        // ==========================================

        console.log("");

        console.log(
            "================================"
        );

        console.log(
            `Archivos recibidos: ${archivos.length}`
        );

        console.log(
            `Archivos procesados: ${resultados.length}`
        );

        console.log(
            `Modo Almacén: ${
                modoAlmacen
                    ? "ACTIVADO"
                    : "DESACTIVADO"
            }`
        );

        console.log(
            "================================"
        );


        // ==========================================
        // SIN ARCHIVOS
        // ==========================================

        if (
            archivos.length === 0
        ) {

            return res.status(400).json({

                error:
                    "No se recibieron archivos XML.",

                total:
                    0,

                resultados:
                    []

            });

        }


        // ==========================================
        // DEVOLVER RESULTADOS
        // ==========================================

        return res.json({

            total:
                resultados.length,

            modoAlmacen,

            resultados

        });

    }

);


// ==========================================
// MANEJO DE ERRORES
// ==========================================

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "ERROR:"
        );

        console.error(
            error.message
        );


        // --------------------------------------
        // MULTER
        // --------------------------------------

        if (
            error instanceof multer.MulterError
        ) {

            return res.status(400).json({

                error:
                    `Error de carga de archivos: ${error.message}`

            });

        }


        // --------------------------------------
        // ERROR GENERAL
        // --------------------------------------

        return res.status(400).json({

            error:
                error.message ||
                "Error al procesar la solicitud."

        });

    }
);


// ==========================================
// SERVIDOR
// ==========================================

const server =
    app.listen(
        PORT,
        HOST,
        () => {

            console.log(
                `Servidor funcionando en http://${HOST}:${PORT}`
            );

        }
    );


// ==========================================
// CIERRE CONTROLADO
// ==========================================

function shutdown(
    signal
) {

    console.log(
        `${signal} recibido; cerrando el servidor`
    );


    server.close(
        () => {

            process.exit(
                0
            );

        }
    );


    setTimeout(
        () => {

            process.exit(
                1
            );

        },
        10000
    ).unref();

}


process.on(
    "SIGTERM",
    () => shutdown("SIGTERM")
);


process.on(
    "SIGINT",
    () => shutdown("SIGINT")
);