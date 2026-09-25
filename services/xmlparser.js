const { XMLParser } = require("fast-xml-parser");


const parser = new XMLParser({

    ignoreAttributes: false,

    attributeNamePrefix: "@_",

    removeNSPrefix: true,

    parseTagValue: true,

    parseAttributeValue: false

});


function parseXML(xml) {

    try {

        const resultado =
            parser.parse(xml);

        return resultado;

    } catch (error) {

        throw new Error(
            `Error al analizar XML: ${error.message}`
        );

    }

}


module.exports = {
    parseXML
};