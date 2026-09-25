"use strict";

// ==========================================
// ELEMENTOS PRINCIPALES
// ==========================================

const form = document.querySelector("form");

const xmlFiles = document.getElementById("xmlFiles");
const fileSelector = document.getElementById("fileSelector");
const fileCounter = document.getElementById("fileCounter");
const fileList = document.getElementById("fileList");

const analyzeButton = document.getElementById("analyzeButton");
const almacenCheck = document.getElementById("modoAlmacen");

const clearButton = document.getElementById("clearButton");

// ==========================================
// ELEMENTOS DE RESULTADOS
// ==========================================

const totalFiles = document.getElementById("totalFiles");
const validFiles = document.getElementById("validFiles");
const invalidFiles = document.getElementById("invalidFiles");

const validCount = document.getElementById("validCount");
const errorCount = document.getElementById("errorCount");

const validFilesList = document.getElementById("validFilesList");
const errorFilesList = document.getElementById("errorFiles");

const resultDetail = document.getElementById("resultDetail");

const validSearch = document.getElementById("validSearch");
const errorSearch = document.getElementById("errorSearch");

// ==========================================
// VISOR XML
// ==========================================

const xmlModal = document.getElementById("xmlModal");
const xmlModalTitle = document.getElementById("xmlModalTitle");
const xmlModalContent = document.getElementById("xmlModalContent");

const xmlModalClose = document.getElementById("xmlModalClose");
const xmlModalCloseButton =
    document.getElementById("xmlModalCloseButton");

const xmlModalOverlay =
    document.querySelector(".xml-modal-overlay");

// ==========================================
// ESTADO
// ==========================================

let resultados = [];
let resultadoSeleccionado = null;
let archivosSeleccionados = [];

// ==========================================
// VALIDACIÓN DE ELEMENTOS
// ==========================================

if (!form) {
    console.error("No se encontró el formulario principal.");
}

if (!xmlFiles) {
    console.error("No se encontró #xmlFiles.");
}

if (!fileSelector) {
    console.error("No se encontró #fileSelector.");
}


// ==========================================
// UTILIDADES
// ==========================================

function esXML(archivo) {

    if (!archivo || !archivo.name) {
        return false;
    }

    return archivo.name
        .toLowerCase()
        .endsWith(".xml");
}


function claveArchivo(archivo) {

    return [
        archivo.name,
        archivo.size,
        archivo.lastModified
    ].join("|");

}


function convertirValor(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return "No encontrado";
    }

    if (typeof valor === "object") {

        try {
            return JSON.stringify(valor);
        } catch {
            return String(valor);
        }

    }

    return String(valor);
}


// ==========================================
// BOTÓN LIMPIAR
// ==========================================

if (clearButton) {

    clearButton.addEventListener(
        "click",
        () => {

            limpiarTodo();

        }
    );

}


// ==========================================
// LIMPIAR TODO
// ==========================================

function limpiarTodo() {

    // --------------------------------------
    // ARCHIVOS
    // --------------------------------------

    archivosSeleccionados = [];

    if (xmlFiles) {
        xmlFiles.value = "";
    }

    actualizarArchivos();


    // --------------------------------------
    // RESULTADOS
    // --------------------------------------

    resultados = [];
    resultadoSeleccionado = null;


    // --------------------------------------
    // RESUMEN
    // --------------------------------------

    actualizarResumen(0, 0, 0);


    // --------------------------------------
    // LISTAS
    // --------------------------------------

    mostrarListaVacia(
        validFilesList,
        "No hay archivos correctos."
    );

    mostrarListaVacia(
        errorFilesList,
        "No hay archivos con errores."
    );


    // --------------------------------------
    // BÚSQUEDAS
    // --------------------------------------

    if (validSearch) {
        validSearch.value = "";
    }

    if (errorSearch) {
        errorSearch.value = "";
    }


    // --------------------------------------
    // SELECCIONES
    // --------------------------------------

    document
        .querySelectorAll(".result-row.selected")
        .forEach(fila => {
            fila.classList.remove("selected");
        });


    // --------------------------------------
    // DETALLE
    // --------------------------------------

    mostrarDetalleVacio();


    // --------------------------------------
    // BOTÓN
    // --------------------------------------

    if (analyzeButton) {

        analyzeButton.disabled = false;

        analyzeButton.textContent =
            "ANALIZAR XML";

    }


    // --------------------------------------
    // CERRAR MODAL
    // --------------------------------------

    cerrarXML();

}


// ==========================================
// SELECCIÓN MEDIANTE INPUT
// ==========================================

if (xmlFiles) {

    xmlFiles.addEventListener(
        "change",
        () => {

            const archivos =
                Array.from(xmlFiles.files || []);


            const archivosXML =
                archivos.filter(esXML);


            archivosSeleccionados =
                eliminarDuplicados(
                    archivosXML
                );


            actualizarArchivos();


            // ----------------------------------
            // NUEVA SELECCIÓN = NUEVOS RESULTADOS
            // ----------------------------------

            limpiarResultadosAnalisis();

        }
    );

}


// ==========================================
// ELIMINAR DUPLICADOS
// ==========================================

function eliminarDuplicados(archivos) {

    const mapa = new Map();

    archivos.forEach(archivo => {

        const clave =
            claveArchivo(archivo);

        if (!mapa.has(clave)) {
            mapa.set(clave, archivo);
        }

    });

    return Array.from(mapa.values());

}


// ==========================================
// DRAG ENTER
// ==========================================

if (fileSelector) {

    fileSelector.addEventListener(
        "dragenter",
        event => {

            event.preventDefault();
            event.stopPropagation();

            fileSelector.classList.add(
                "drag-over"
            );

        }
    );


    // ======================================
    // DRAG OVER
    // ======================================

    fileSelector.addEventListener(
        "dragover",
        event => {

            event.preventDefault();
            event.stopPropagation();

            if (event.dataTransfer) {

                event.dataTransfer.dropEffect =
                    "copy";

            }

            fileSelector.classList.add(
                "drag-over"
            );

        }
    );


    // ======================================
    // DRAG LEAVE
    // ======================================

    fileSelector.addEventListener(
        "dragleave",
        event => {

            event.preventDefault();
            event.stopPropagation();

            if (
                !fileSelector.contains(
                    event.relatedTarget
                )
            ) {

                fileSelector.classList.remove(
                    "drag-over"
                );

            }

        }
    );


    // ======================================
    // DROP
    // ======================================

    fileSelector.addEventListener(
        "drop",
        event => {

            event.preventDefault();
            event.stopPropagation();

            fileSelector.classList.remove(
                "drag-over"
            );


            const archivos =
                Array.from(
                    event.dataTransfer?.files || []
                );


            if (archivos.length === 0) {
                return;
            }


            const archivosXML =
                archivos.filter(esXML);


            if (archivosXML.length === 0) {

                mostrarAviso(
                    "No se encontraron archivos XML."
                );

                return;

            }


            // ----------------------------------
            // AGREGAR SIN DUPLICADOS
            // ----------------------------------

            agregarArchivos(
                archivosXML
            );


            // ----------------------------------
            // ANALIZAR AUTOMÁTICAMENTE
            // ----------------------------------

            analizarArchivos();

        }
    );

}


// ==========================================
// PEGAR ARCHIVOS CTRL + V
// ==========================================

document.addEventListener(
    "paste",
    event => {

        const items =
            event.clipboardData?.items;


        if (!items) {
            return;
        }


        const archivos = [];


        for (const item of items) {

            if (item.kind !== "file") {
                continue;
            }


            const archivo =
                item.getAsFile();


            if (archivo) {
                archivos.push(archivo);
            }

        }


        if (archivos.length === 0) {
            return;
        }


        const archivosXML =
            archivos.filter(esXML);


        if (archivosXML.length === 0) {

            mostrarAviso(
                "El archivo pegado no es un XML válido."
            );

            return;

        }


        agregarArchivos(
            archivosXML
        );

    }
);


// ==========================================
// AGREGAR ARCHIVOS
// ==========================================

function agregarArchivos(archivos) {

    const archivosXML =
        archivos.filter(esXML);


    if (archivosXML.length === 0) {
        return;
    }


    const existentes =
        new Map(
            archivosSeleccionados.map(
                archivo => [
                    claveArchivo(archivo),
                    archivo
                ]
            )
        );


    archivosXML.forEach(archivo => {

        const clave =
            claveArchivo(archivo);


        if (!existentes.has(clave)) {

            existentes.set(
                clave,
                archivo
            );

        }

    });


    archivosSeleccionados =
        Array.from(
            existentes.values()
        );


    actualizarInput();
    actualizarArchivos();


    limpiarResultadosAnalisis();

}


// ==========================================
// ACTUALIZAR INPUT FILE
// ==========================================

function actualizarInput() {

    if (!xmlFiles) {
        return;
    }


    try {

        const dataTransfer =
            new DataTransfer();


        archivosSeleccionados.forEach(
            archivo => {

                dataTransfer.items.add(
                    archivo
                );

            }
        );


        xmlFiles.files =
            dataTransfer.files;

    } catch (error) {

        /*
         * Algunos navegadores pueden no permitir
         * modificar FileList directamente.
         */

        console.warn(
            "No fue posible actualizar FileList:",
            error
        );

    }

}


// ==========================================
// ACTUALIZAR ARCHIVOS
// ==========================================

function actualizarArchivos() {

    if (!fileCounter || !fileList) {
        return;
    }


    const cantidad =
        archivosSeleccionados.length;


    // --------------------------------------
    // CONTADOR
    // --------------------------------------

    if (cantidad === 0) {

        fileCounter.textContent =
            "0 archivos seleccionados";

    } else if (cantidad === 1) {

        fileCounter.textContent =
            "1 archivo seleccionado";

    } else {

        fileCounter.textContent =
            `${cantidad} archivos seleccionados`;

    }


    // --------------------------------------
    // LISTA
    // --------------------------------------

    fileList.innerHTML = "";


    archivosSeleccionados.forEach(
        (archivo, index) => {

            const elemento =
                document.createElement("div");


            elemento.className =
                "file-item";


            elemento.textContent =
                `${index + 1}. ${archivo.name}`;


            fileList.appendChild(
                elemento
            );

        }
    );

}


// ==========================================
// LIMPIAR RESULTADOS DE ANÁLISIS
// ==========================================

function limpiarResultadosAnalisis() {

    resultados = [];

    resultadoSeleccionado = null;


    actualizarResumen(
        0,
        0,
        0
    );


    mostrarListaVacia(
        errorFilesList,
        "No hay archivos con errores."
    );


    mostrarListaVacia(
        validFilesList,
        "No hay archivos correctos."
    );


    if (errorSearch) {
        errorSearch.value = "";
    }

    if (validSearch) {
        validSearch.value = "";
    }


    mostrarDetalleVacio();

}


// ==========================================
// ANALIZAR DESDE EL FORMULARIO
// ==========================================

if (form) {

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            await analizarArchivos();

        }
    );

}


// ==========================================
// ANALIZAR ARCHIVOS
// ==========================================

async function analizarArchivos() {

    if (
        !archivosSeleccionados ||
        archivosSeleccionados.length === 0
    ) {

        mostrarAviso(
            "Selecciona al menos un archivo XML."
        );

        return;

    }


    // --------------------------------------
    // EVITAR DOBLE ANÁLISIS
    // --------------------------------------

    if (
        analyzeButton &&
        analyzeButton.disabled
    ) {

        return;

    }


    // --------------------------------------
    // COPIA DE LOS ARCHIVOS
    // --------------------------------------

    const archivos =
        [...archivosSeleccionados];


    // --------------------------------------
    // BOTÓN
    // --------------------------------------

    if (analyzeButton) {

        analyzeButton.disabled = true;

        analyzeButton.textContent =
            "ANALIZANDO...";

    }


    // --------------------------------------
    // ESTADO
    // --------------------------------------

    resultados = [];
    resultadoSeleccionado = null;


    mostrarEstadoAnalizando(
        archivos.length
    );


    // --------------------------------------
    // FORM DATA
    // --------------------------------------

    const formData =
        new FormData();


    archivos.forEach(
        archivo => {

            formData.append(
                "xmlFiles",
                archivo,
                archivo.name
            );

        }
    );


    // IMPORTANTE:
    // modoAlmacen se envía UNA SOLA VEZ.

    formData.append(
        "modoAlmacen",
        almacenCheck?.checked
            ? "true"
            : "false"
    );


    try {

        // ----------------------------------
        // PETICIÓN
        // ----------------------------------

        const response =
            await fetch(
                "/analizar",
                {
                    method: "POST",
                    body: formData
                }
            );


        // ----------------------------------
        // LEER RESPUESTA
        // ----------------------------------

        let data = null;


        try {

            data =
                await response.json();

        } catch {

            throw new Error(
                "El servidor devolvió una respuesta inválida."
            );

        }


        // ----------------------------------
        // ERROR HTTP
        // ----------------------------------

        if (!response.ok) {

            throw new Error(
                data?.error ||
                "No fue posible analizar los archivos."
            );

        }


        // ----------------------------------
        // RESULTADOS
        // ----------------------------------

        resultados =
            Array.isArray(
                data?.resultados
            )
                ? data.resultados
                : [];


        // ----------------------------------
        // MOSTRAR
        // ----------------------------------

        mostrarResultados();


    } catch (error) {

        console.error(
            "Error al analizar XML:",
            error
        );


        mostrarErrorGeneral(
            error?.message ||
            "Ocurrió un error al analizar los archivos."
        );


    } finally {

        if (analyzeButton) {

            analyzeButton.disabled = false;

            analyzeButton.textContent =
                "ANALIZAR XML";

        }

    }

}


// ==========================================
// MOSTRAR ESTADO ANALIZANDO
// ==========================================

function mostrarEstadoAnalizando(cantidad) {

    actualizarResumen(
        0,
        0,
        0
    );


    mostrarListaVacia(
        validFilesList,
        "Analizando archivos..."
    );


    mostrarListaVacia(
        errorFilesList,
        "Analizando archivos..."
    );


    if (!resultDetail) {
        return;
    }


    resultDetail.innerHTML = `

        <div class="detail-empty">

            <div class="detail-empty-icon">
                XML
            </div>

            <p>
                Analizando
                ${cantidad}
                archivo(s)...
            </p>

        </div>

    `;

}


// ==========================================
// MOSTRAR RESULTADOS
// ==========================================

function mostrarResultados() {

    const correctos =
        resultados.filter(
            resultado =>
                Boolean(resultado?.correcto)
        );


    const incorrectos =
        resultados.filter(
            resultado =>
                !Boolean(resultado?.correcto)
        );


    // --------------------------------------
    // RESUMEN
    // --------------------------------------

    actualizarResumen(
        resultados.length,
        correctos.length,
        incorrectos.length
    );


    // --------------------------------------
    // LISTAS
    // --------------------------------------

    renderizarListaErrores(
        incorrectos
    );


    renderizarListaCorrectos(
        correctos
    );


    // --------------------------------------
    // DETALLE
    // --------------------------------------

    if (resultados.length === 0) {

        mostrarDetalleVacio();

        return;

    }


    // --------------------------------------
    // SELECCIONAR PRIMERO CON ERROR
    // --------------------------------------

    if (incorrectos.length > 0) {

        seleccionarResultado(
            incorrectos[0]
        );

    } else {

        seleccionarResultado(
            correctos[0]
        );

    }

}


// ==========================================
// ACTUALIZAR RESUMEN
// ==========================================

function actualizarResumen(
    total,
    correctos,
    incorrectos
) {

    if (totalFiles) {
        totalFiles.textContent = total;
    }

    if (validFiles) {
        validFiles.textContent = correctos;
    }

    if (invalidFiles) {
        invalidFiles.textContent = incorrectos;
    }

    if (validCount) {
        validCount.textContent = correctos;
    }

    if (errorCount) {
        errorCount.textContent = incorrectos;
    }

}


// ==========================================
// LISTA VACÍA
// ==========================================

function mostrarListaVacia(
    lista,
    mensaje
) {

    if (!lista) {
        return;
    }


    lista.innerHTML = "";


    const elemento =
        document.createElement("div");


    elemento.className =
        "list-empty";


    elemento.textContent =
        mensaje;


    lista.appendChild(
        elemento
    );

}


// ==========================================
// LISTA DE ERRORES
// ==========================================

function renderizarListaErrores(lista) {

    if (!errorFilesList) {
        return;
    }


    errorFilesList.innerHTML = "";


    if (!lista.length) {

        mostrarListaVacia(
            errorFilesList,
            "No hay archivos con errores."
        );

        return;

    }


    lista.forEach(
        resultado => {

            errorFilesList.appendChild(
                crearFilaResultado(
                    resultado
                )
            );

        }
    );

}


// ==========================================
// LISTA CORRECTOS
// ==========================================

function renderizarListaCorrectos(lista) {

    if (!validFilesList) {
        return;
    }


    validFilesList.innerHTML = "";


    if (!lista.length) {

        mostrarListaVacia(
            validFilesList,
            "No hay archivos correctos."
        );

        return;

    }


    lista.forEach(
        resultado => {

            validFilesList.appendChild(
                crearFilaResultado(
                    resultado
                )
            );

        }
    );

}


// ==========================================
// CREAR FILA DE RESULTADO
// ==========================================

function crearFilaResultado(resultado) {

    const fila =
        document.createElement("div");


    fila.className =
        "result-row";


    fila.dataset.archivo =
        resultado?.archivo || "";


    // --------------------------------------
    // NOMBRE
    // --------------------------------------

    const nombre =
        document.createElement("span");


    nombre.className =
        "result-row-name";


    nombre.textContent =
        resultado?.archivo ||
        "Archivo sin nombre";


    fila.appendChild(
        nombre
    );


    // --------------------------------------
    // ESTADO
    // --------------------------------------

    if (resultado?.correcto) {

        const estado =
            document.createElement("span");


        const tieneRevisiones =
            Array.isArray(
                resultado.revisiones
            ) &&
            resultado.revisiones.length > 0;


        if (tieneRevisiones) {

            estado.className =
                "result-row-review";

            estado.textContent =
                "⚠";

            estado.title =
                "Requiere revisión manual";

        } else {

            estado.className =
                "result-row-valid";

            estado.textContent =
                "✓";

            estado.title =
                "Correcta";

        }


        fila.appendChild(
            estado
        );

    } else {

        const errores =
            document.createElement("span");


        errores.className =
            "result-row-errors";


        const cantidad =
            Array.isArray(
                resultado?.errores
            )
                ? resultado.errores.length
                : 0;


        errores.textContent =
            cantidad === 1
                ? "1 error"
                : `${cantidad} errores`;


        fila.appendChild(
            errores
        );

    }


    // --------------------------------------
    // CLICK
    // --------------------------------------

    fila.addEventListener(
        "click",
        () => {

            seleccionarResultado(
                resultado
            );

        }
    );


    // --------------------------------------
    // DOBLE CLICK → XML
    // --------------------------------------

    fila.addEventListener(
        "dblclick",
        () => {

            abrirXML(
                resultado?.archivo
            );

        }
    );


    return fila;

}


// ==========================================
// SELECCIONAR RESULTADO
// ==========================================

function seleccionarResultado(resultado) {

    if (!resultado) {
        return;
    }


    resultadoSeleccionado =
        resultado;


    // --------------------------------------
    // QUITAR SELECCIÓN
    // --------------------------------------

    document
        .querySelectorAll(
            ".result-row.selected"
        )
        .forEach(
            fila => {

                fila.classList.remove(
                    "selected"
                );

            }
        );


    // --------------------------------------
    // SELECCIONAR FILAS CON MISMO ARCHIVO
    // --------------------------------------

    document
        .querySelectorAll(
            ".result-row"
        )
        .forEach(
            fila => {

                if (
                    fila.dataset.archivo ===
                    resultado.archivo
                ) {

                    fila.classList.add(
                        "selected"
                    );

                }

            }
        );


    // --------------------------------------
    // DETALLE
    // --------------------------------------

    renderizarDetalle(
        resultado
    );

}


// ==========================================
// RENDERIZAR DETALLE
// ==========================================

function renderizarDetalle(resultado) {

    if (!resultDetail) {
        return;
    }


    resultDetail.innerHTML = "";


    // --------------------------------------
    // CABECERA
    // --------------------------------------

    const archivo =
        document.createElement("div");


    archivo.className =
        "detail-file";


    const nombre =
        document.createElement("div");


    nombre.className =
        "detail-file-name";


    nombre.textContent =
        resultado?.archivo ||
        "Archivo sin nombre";


    archivo.appendChild(
        nombre
    );


    const estado =
        document.createElement("span");


    estado.className =
        resultado?.correcto

            ? "detail-status detail-status-valid"

            : "detail-status detail-status-invalid";


    estado.textContent =
        resultado?.correcto

            ? "✓ VÁLIDA"

            : "✕ NO VÁLIDA";


    archivo.appendChild(
        estado
    );


    resultDetail.appendChild(
        archivo
    );


    // ======================================
    // FACTURA CORRECTA
    // ======================================

    if (resultado?.correcto) {

        renderizarEstadoValido(
            resultado
        );

    }


    // ======================================
    // ERRORES
    // ======================================

    renderizarErroresDetalle(
        resultado
    );


    // ======================================
    // REVISIONES
    // ======================================

    renderizarRevisionesDetalle(
        resultado
    );

}


// ==========================================
// ESTADO VÁLIDO
// ==========================================

function renderizarEstadoValido(resultado) {

    const revisiones =
        Array.isArray(
            resultado?.revisiones
        )
            ? resultado.revisiones
            : [];


    const estadoFactura =
        document.createElement("div");


    estadoFactura.className =
        "detail-valid";


    // --------------------------------------
    // MENSAJE
    // --------------------------------------

    const mensaje =
        document.createElement("div");


    mensaje.className =
        "detail-valid-field";


    mensaje.textContent =
        revisiones.length > 0

            ? "La factura no presenta errores, pero contiene revisiones manuales."

            : "La factura cumple todas las reglas de validación.";


    mensaje.title =
        "Haz clic para ver las reglas";


    estadoFactura.appendChild(
        mensaje
    );


    // --------------------------------------
    // CONTENIDO
    // --------------------------------------

    const contenido =
        document.createElement("div");


    contenido.className =
        "detail-valid-content";


    // --------------------------------------
    // REGLAS
    // --------------------------------------

    const reglas = [

        "Datos del receptor",

        "Datos del emisor",

        "Método y forma de pago",

        "Datos de los conceptos",

        "Carta Porte / Transporte"

    ];


    reglas.forEach(
        regla => {

            const elemento =
                document.createElement("div");


            elemento.className =
                "detail-valid-rule";


            const nombre =
                document.createElement("span");


            nombre.textContent =
                regla;


            const palomita =
                document.createElement("span");


            palomita.className =
                "detail-valid-rule-check";


            palomita.textContent =
                "✓";


            elemento.appendChild(
                nombre
            );

            elemento.appendChild(
                palomita
            );


            contenido.appendChild(
                elemento
            );

        }
    );


    estadoFactura.appendChild(
        contenido
    );


    // --------------------------------------
    // DESPLEGAR
    // --------------------------------------

    mensaje.addEventListener(
        "click",
        () => {

            estadoFactura.classList.toggle(
                "expanded"
            );

        }
    );


    resultDetail.appendChild(
        estadoFactura
    );

}


// ==========================================
// ERRORES DEL RESULTADO
// ==========================================

function renderizarErroresDetalle(resultado) {

    const errores =
        Array.isArray(
            resultado?.errores
        )
            ? resultado.errores
            : [];


    if (errores.length === 0) {
        return;
    }


    // --------------------------------------
    // RESUMEN
    // --------------------------------------

    const resumen =
        document.createElement("div");


    resumen.className =
        "detail-error-summary";


    resumen.textContent =
        errores.length === 1

            ? "Se encontró 1 error de validación."

            : `Se encontraron ${errores.length} errores de validación.`;


    resultDetail.appendChild(
        resumen
    );


    // --------------------------------------
    // ERRORES
    // --------------------------------------

    errores.forEach(
        error => {

            const elemento =
                document.createElement("div");


            elemento.className =
                "detail-error";


            // ----------------------------------
            // CAMPO
            // ----------------------------------

            const campo =
                document.createElement("div");


            campo.className =
                "detail-error-field";


            campo.textContent =
                convertirValor(
                    error?.campo
                );


            campo.title =
                "Haz clic para ver la descripción";


            elemento.appendChild(
                campo
            );


            // ----------------------------------
            // CONTENIDO
            // ----------------------------------

            const contenido =
                document.createElement("div");


            contenido.className =
                "detail-error-content";


            // ----------------------------------
            // MENSAJE
            // ----------------------------------

            const mensaje =
                document.createElement("div");


            mensaje.className =
                "detail-error-message";


            mensaje.textContent =
                convertirValor(
                    error?.mensaje
                );


            contenido.appendChild(
                mensaje
            );


            // ----------------------------------
            // VALORES
            // ----------------------------------

            const valores =
                document.createElement("div");


            valores.className =
                "detail-values";


            valores.appendChild(
                crearValorDetalle(
                    "Encontrado",
                    convertirValor(
                        error?.valorEncontrado
                    )
                )
            );


            valores.appendChild(
                crearValorDetalle(
                    "Esperado",
                    convertirValor(
                        error?.valorEsperado
                    )
                )
            );


            contenido.appendChild(
                valores
            );


            elemento.appendChild(
                contenido
            );


            // ----------------------------------
            // DESPLEGAR
            // ----------------------------------

            campo.addEventListener(
                "click",
                () => {

                    elemento.classList.toggle(
                        "expanded"
                    );

                }
            );


            resultDetail.appendChild(
                elemento
            );

        }
    );

}


// ==========================================
// REVISIONES INTERNAS
// ==========================================

function renderizarRevisionesDetalle(resultado) {

    const revisiones =
        Array.isArray(
            resultado?.revisiones
        )
            ? resultado.revisiones
            : [];


    if (revisiones.length === 0) {
        return;
    }


    revisiones.forEach(
        revision => {

            const elemento =
                document.createElement("div");


            elemento.className =
                "detail-review";


            // ----------------------------------
            // CAMPO
            // ----------------------------------

            const campo =
                document.createElement("div");


            campo.className =
                "detail-review-field";


            campo.textContent =
                convertirValor(
                    revision?.campo
                );


            campo.title =
                "Haz clic para ver la descripción";


            elemento.appendChild(
                campo
            );


            // ----------------------------------
            // CONTENIDO
            // ----------------------------------

            const contenido =
                document.createElement("div");


            contenido.className =
                "detail-review-content";


            // ----------------------------------
            // MENSAJE
            // ----------------------------------

            const mensaje =
                document.createElement("div");


            mensaje.className =
                "detail-review-message";


            mensaje.textContent =
                convertirValor(
                    revision?.mensaje
                );


            contenido.appendChild(
                mensaje
            );


            // ----------------------------------
            // VALORES
            // ----------------------------------

            const valores =
                document.createElement("div");


            valores.className =
                "detail-values";


            valores.appendChild(
                crearValorDetalle(
                    "Encontrado",
                    convertirValor(
                        revision?.valorEncontrado
                    )
                )
            );


            valores.appendChild(
                crearValorDetalle(
                    "Esperado",
                    convertirValor(
                        revision?.valorEsperado
                    )
                )
            );


            contenido.appendChild(
                valores
            );


            elemento.appendChild(
                contenido
            );


            // ----------------------------------
            // DESPLEGAR
            // ----------------------------------

            campo.addEventListener(
                "click",
                () => {

                    elemento.classList.toggle(
                        "expanded"
                    );

                }
            );


            resultDetail.appendChild(
                elemento
            );

        }
    );

}


// ==========================================
// CREAR VALOR DEL DETALLE
// ==========================================

function crearValorDetalle(
    titulo,
    valor
) {

    const elemento =
        document.createElement("div");


    elemento.className =
        "detail-value";


    const etiqueta =
        document.createElement("strong");


    etiqueta.textContent =
        titulo;


    const contenido =
        document.createElement("span");


    contenido.textContent =
        valor;


    elemento.appendChild(
        etiqueta
    );


    elemento.appendChild(
        contenido
    );


    return elemento;

}


// ==========================================
// DETALLE VACÍO
// ==========================================

function mostrarDetalleVacio() {

    if (!resultDetail) {
        return;
    }


    resultDetail.innerHTML = `

        <div class="detail-empty">

            <div class="detail-empty-icon">
                XML
            </div>

            <p>
                Selecciona un archivo para
                consultar el resultado.
            </p>

        </div>

    `;

}


// ==========================================
// ABRIR XML
// ==========================================

async function abrirXML(nombreArchivo) {

    if (!nombreArchivo) {
        return;
    }


    // --------------------------------------
    // BUSCAR ARCHIVO
    // --------------------------------------

    const archivo =
        archivosSeleccionados.find(
            archivo =>
                archivo.name ===
                nombreArchivo
        );


    if (!archivo) {

        mostrarAviso(
            "No se encontró el archivo XML original."
        );

        console.error(
            "No se encontró el archivo:",
            nombreArchivo
        );

        return;

    }


    try {

        // ----------------------------------
        // LEER XML
        // ----------------------------------

        const contenido =
            await archivo.text();


        // ----------------------------------
        // TÍTULO
        // ----------------------------------

        if (xmlModalTitle) {

            xmlModalTitle.textContent =
                nombreArchivo;

        }


        // ----------------------------------
        // CONTENIDO
        // ----------------------------------

        if (xmlModalContent) {

            xmlModalContent.textContent =
                contenido;

            xmlModalContent.scrollTop = 0;

        }


        // ----------------------------------
        // ABRIR
        // ----------------------------------

        if (xmlModal) {

            xmlModal.classList.add(
                "open"
            );

            xmlModal.setAttribute(
                "aria-hidden",
                "false"
            );

        }


        document.body.classList.add(
            "xml-modal-open"
        );


    } catch (error) {

        console.error(
            "Error al abrir XML:",
            error
        );


        mostrarAviso(
            "No fue posible abrir el XML."
        );

    }

}


// ==========================================
// CERRAR XML
// ==========================================

function cerrarXML() {

    if (xmlModal) {

        xmlModal.classList.remove(
            "open"
        );

        xmlModal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    document.body.classList.remove(
        "xml-modal-open"
    );

}


// ==========================================
// BOTONES DEL MODAL
// ==========================================

if (xmlModalClose) {

    xmlModalClose.addEventListener(
        "click",
        cerrarXML
    );

}


if (xmlModalCloseButton) {

    xmlModalCloseButton.addEventListener(
        "click",
        cerrarXML
    );

}


if (xmlModalOverlay) {

    xmlModalOverlay.addEventListener(
        "click",
        cerrarXML
    );

}


// ==========================================
// ESC → CERRAR MODAL
// ==========================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            xmlModal?.classList.contains("open")
        ) {

            cerrarXML();

        }

    }
);


// ==========================================
// ERROR GENERAL
// ==========================================

function mostrarErrorGeneral(mensaje) {

    resultados = [];
    resultadoSeleccionado = null;


    actualizarResumen(
        0,
        0,
        0
    );


    mostrarListaVacia(
        validFilesList,
        "No disponible."
    );


    mostrarListaVacia(
        errorFilesList,
        "No disponible."
    );


    if (!resultDetail) {
        return;
    }


    resultDetail.innerHTML = "";


    const errorElemento =
        document.createElement("div");


    errorElemento.className =
        "detail-error";


    const errorCampo =
        document.createElement("div");


    errorCampo.className =
        "detail-error-field";


    errorCampo.textContent =
        "Error al analizar";


    const errorMensaje =
        document.createElement("div");


    errorMensaje.className =
        "detail-error-message";


    errorMensaje.textContent =
        convertirValor(
            mensaje
        );


    errorElemento.appendChild(
        errorCampo
    );


    errorElemento.appendChild(
        errorMensaje
    );


    resultDetail.appendChild(
        errorElemento
    );

}


// ==========================================
// BÚSQUEDA DE ERRORES
// ==========================================

if (errorSearch) {

    errorSearch.addEventListener(
        "input",
        () => {

            filtrarLista(
                errorSearch,
                errorFilesList
            );

        }
    );

}


// ==========================================
// BÚSQUEDA DE CORRECTOS
// ==========================================

if (validSearch) {

    validSearch.addEventListener(
        "input",
        () => {

            filtrarLista(
                validSearch,
                validFilesList
            );

        }
    );

}


// ==========================================
// FILTRAR LISTA
// ==========================================

function filtrarLista(
    input,
    lista
) {

    if (!input || !lista) {
        return;
    }


    const texto =
        input.value
            .trim()
            .toLowerCase();


    const filas =
        lista.querySelectorAll(
            ".result-row"
        );


    filas.forEach(
        fila => {

            const nombre =
                (
                    fila.dataset.archivo ||
                    ""
                )
                    .toLowerCase();


            fila.style.display =
                nombre.includes(texto)
                    ? ""
                    : "none";

        }
    );

}


// ==========================================
// AVISO SIMPLE
// ==========================================

function mostrarAviso(mensaje) {

    /*
     * Si tu HTML tiene un sistema de alertas
     * puedes sustituir este alert posteriormente.
     */

    window.alert(
        mensaje
    );

}


// ==========================================
// INICIALIZACIÓN
// ==========================================

actualizarArchivos();

mostrarListaVacia(
    validFilesList,
    "No hay archivos correctos."
);

mostrarListaVacia(
    errorFilesList,
    "No hay archivos con errores."
);

mostrarDetalleVacio();

actualizarResumen(
    0,
    0,
    0
);
// =========================================================
// MODAL REGLAS DE VALIDACIÓN
// =========================================================

const validationRulesButton =
    document.getElementById("validationRulesButton");

const validationRulesModal =
    document.getElementById("validationRulesModal");

const validationRulesModalClose =
    document.getElementById("validationRulesModalClose");

const validationRulesModalCloseButton =
    document.getElementById("validationRulesModalCloseButton");


// =========================================================
// ABRIR MODAL
// =========================================================

function abrirReglasValidacion() {

    if (!validationRulesModal) {
        return;
    }

    validationRulesModal.classList.add("is-open");

    document.body.classList.add(
        "validation-rules-modal-open"
    );

}


// =========================================================
// CERRAR MODAL
// =========================================================

function cerrarReglasValidacion() {

    if (!validationRulesModal) {
        return;
    }

    validationRulesModal.classList.remove("is-open");

    document.body.classList.remove(
        "validation-rules-modal-open"
    );

}


// =========================================================
// BOTÓN PRINCIPAL
// =========================================================

if (validationRulesButton) {

    validationRulesButton.addEventListener(
        "click",
        abrirReglasValidacion
    );

}


// =========================================================
// BOTÓN X
// =========================================================

if (validationRulesModalClose) {

    validationRulesModalClose.addEventListener(
        "click",
        cerrarReglasValidacion
    );

}


// =========================================================
// BOTÓN CERRAR
// =========================================================

if (validationRulesModalCloseButton) {

    validationRulesModalCloseButton.addEventListener(
        "click",
        cerrarReglasValidacion
    );

}


// =========================================================
// CERRAR AL HACER CLICK FUERA DE LA VENTANA
// =========================================================

if (validationRulesModal) {

    validationRulesModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                validationRulesModal
            ) {

                cerrarReglasValidacion();

            }

        }
    );

}


// =========================================================
// ESC → CERRAR REGLAS
// =========================================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            validationRulesModal?.classList.contains("is-open")
        ) {

            cerrarReglasValidacion();

        }

    }
);


// =========================================================
// REGLAS DESPLEGABLES
// =========================================================

const validationRuleToggles =
    document.querySelectorAll(
        ".validation-rule-toggle"
    );


validationRuleToggles.forEach(
    toggle => {

        toggle.addEventListener(
            "click",
            () => {

                const ruleItem =
                    toggle.closest(
                        ".validation-rule-item"
                    );

                if (!ruleItem) {
                    return;
                }

                ruleItem.classList.toggle(
                    "expanded"
                );

            }
        );

    }
);