/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */

/*global define,log*/
define(['N/render', 'N/file', 'N/search'], function (render, file, search) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ---------------------------- onRequest - Begin --------------------------- */
  const onRequest = (context) => {
    const strLoggerTitle = 'On Request';
    log.audit(
      strLoggerTitle,
      '|>--------------' + strLoggerTitle + ' - Entry--------------<|'
    );
    //
    try {
      const recordIds = context.request.parameters['records'].split(',');

      const printType = context.request.parameters['printLayout'];

      log.debug(strLoggerTitle + 'Record IDS', recordIds);

      log.debug(strLoggerTitle + 'Print Type', printType);

      // Retrieve XML Variable
      let xmlFile = retrieveXML12();

      for (let index = 0; index < recordIds.length; index++) {
        const fieldLookUp = search.lookupFields({
          type: 'inventoryitem',
          id: recordIds[index],
          columns: ['itemid', 'displayname', 'custitem_bcc_size', 'upccode'],
        });
        log.debug(strLoggerTitle, fieldLookUp);
        //
        const upccode = fieldLookUp.upccode;
        fieldLookUp.upccode = Math.trunc(upccode);
        log.debug(strLoggerTitle, fieldLookUp.upccode);
        xmlFile = loopTableData(xmlFile, fieldLookUp);
      }

      xmlFile += '    </table>\n'; // Closing table tag
      xmlFile += '  </body>\n'; // Closing body tag
      xmlFile += '</pdf>\n'; // Closing pdf tag

      var pdf = render.xmlToPdf({
        xmlString: xmlFile,
      });
      context.response.writeFile({ file: pdf, isInline: true });
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>--------------' + strLoggerTitle + ' - Exit--------------<|'
    );
    //
  };
  /* ---------------------------- onRequest - End --------------------------- */
  //
  /* ----------------------------- retrieveXML12 - Begin ---------------------------- */
  const retrieveXML12 = () => {
    const xmlVariable = `<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
  <pdf>
  <head>
      <!-- <link name="arial" type="font" subtype="opentype" src="https://6922326.app.netsuite.com/core/media/media.nl?id=4576&amp;c=6922326&amp;h=dKkjoI8BYQgN8LDnKMOwjGECqBCzBZ66bWT09u9SDYAlmfb3&amp;_xt=.ttf" bytes="2" /> -->
  
       <#assign arialTest = "https://6922326.app.netsuite.com/core/media/media.nl?id=4576&amp;c=6922326&amp;h=dKkjoI8BYQgN8LDnKMOwjGECqBCzBZ66bWT09u9SDYAlmfb3&amp;_xt=.ttf" />
    <link type="font" name="Arial" subtype="TrueType" src="\${arialTest?html}" src-bold="\${arialTest?html}" src-italic="\${arialTest?html}" src-bolditalic="\${arialTest?html}" bytes="2"/>
  
    <style type="text/css">
      .text-center {
        text-align: center;
      }
  
      .text-left {
        text-align: left;
      }
  
      .text-right {
        text-align: right;
      }
  
      .font-size-10 {
        font-size: 10px;
      }
  
      .font-size-12 {
        font-size: 12px;
      }
  
      .font-size-14 {
        font-size: 14px;
      }
  
      .font-size-18 {
        font-size: 18px;
      }
  
      .font-size-22 {
        font-size: 22px;
      }
  
      .padding-10 {
        padding-top: 10px;
      }
  
      .padding-20 {
        padding-top: 20px;
      }
  
      .margin-10 {
        margin-top: 10px;
      }
  
      .margin-20 {
        margin-top: 20px;
      }
  
      .border-bottom {
        border-bottom: 1px solid black;
      }
  
      .border-bottom-dotted {
        border-bottom: 1px dotted black;
      }
  
      .border-top {
        border-top: 1px solid black;
      }
  
      .border-left {
        border-left: 1px solid black;
      }
  
      .border-right {
        border-right: 1px solid black;
      }
  
      .border-none {
        border: none;
      }
    </style>
  </head>
  
  <body header="nlheader" header-height="10%" footer="nlfooter" footer-height="20pt" margin="0.5in 0.5in 0.5in 0.5in" size="Letter" font-family="Arial" font-size="8pt">
    <table style="width:100%;border:none;margin-bottom:10px;">
      <tr>
        <td style="width:100%;border:none;text-align:center;">
          <p class="font-size-22">Product Barcode Label</p>
        </td>
      </tr>
    </table>
    <table style="width:100%;border:none;margin-bottom:10px;">
      <tr>
        <td style="width:75%;border:none;">
          <table style="width:100%;margin-bottom:5px;">
            <tr>
              <td style="width:30%;border:none;font-weight:bold;font-size:12px;">ITEM #</td>
              <td style="width:70%;border:none;font-size:14px;">Item Display Name</td>
            </tr>
            <tr>
              <td style="width:30%;border:none;font-size:18px;padding-bottom:5px;">Size</td>
              <td style="width:70%;border:none;font-size:18px;padding-bottom:5px;">Bar Code</td>
            </tr>
          </table>
        </td>
        <td style="width:25%;border:none;text-align:right;">
          <img src="https://6922326.app.netsuite.com/core/media/media.nl?id=4566&amp;c=6922326&amp;h=QtDyBlQDSXg5fU0PlJzLrqtyV9ajvaZ9EBBnxnALQj9Mo7Yf" style="width:40px; height: 40px; display: block;" />
        </td>
      </tr>
    </table>
    <table style="width:100%;border:none;margin-bottom:10px;">
`;
    return xmlVariable;
  };
  /* ------------------------------ retrieveXML12 - End ----------------------------- */
  //
  /* ----------------------------- loopTableData - Begin ---------------------------- */
  const loopTableData = (xmlFile, fieldLookUp) => {
    const tableRow = `
    <tr>
      <td class="border-bottom" style="width:30%;text-align:left;"><span class="font-size-14">${fieldLookUp.itemid}</span></td>
      <td class="border-bottom" style="width:70%;text-align:left;"><span class="font-size-14">${fieldLookUp.displayname}</span></td>
    </tr>
    <tr>
      <td class="border-bottom-dotted" style="width:30%;text-align:left;"><span class="font-size-18">${fieldLookUp.custitem_bcc_size}</span></td>
      <td class="border-bottom-dotted" style="width:70%;text-align:left;"><span class="font-size-18">${fieldLookUp.upccode}</span></td>
    </tr>
  `;
    xmlFile += tableRow;
    return xmlFile;
  };
  /* ------------------------------ loopTableData - End ----------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.onRequest = onRequest;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
