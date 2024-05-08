/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */

/*global define,log*/
define(['N/search', 'N/runtime'], function (search, runtime) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ---------------------------- onRequest - Begin --------------------------- */
  const onRequest = (context) => {
    const strLoggerTitle = 'On Request';
    const scriptObj = runtime.getCurrentScript();
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
      let xmlFile;
      if (printType == 12) {
        xmlFile = retrieveXML12();
      } else {
        xmlFile = retrieveXML14();
      }

      for (let index = 0; index < recordIds.length; index++) {
        if (printType == 12) {
          const fieldLookUp = search.lookupFields({
            type: 'inventoryitem',
            id: recordIds[index],
            columns: ['itemid', 'displayname', 'custitem_bcc_size', 'upccode'],
          });
          log.debug(strLoggerTitle, fieldLookUp);
          //
          if (Object.keys(fieldLookUp).length > 0) {
            // Item ID
            if (fieldLookUp.itemid && fieldLookUp.itemid.includes(':')) {
              fieldLookUp.itemid = fieldLookUp.itemid.split(': ')[1];
            }
            //

            // UPC Code
            const upccode = fieldLookUp.upccode;
            fieldLookUp.upccode = Math.trunc(upccode);
            //

            xmlFile = loopTableData12(xmlFile, fieldLookUp);
          }
          //
        } else {
          const fieldLookUp = search.lookupFields({
            type: 'inventoryitem',
            id: recordIds[index],
            columns: [
              'itemid',
              'displayname',
              'custitem_bcc_size',
              'custitem5',
              'custitem_pcs',
            ],
          });
          log.debug(strLoggerTitle, fieldLookUp);
          //
          if (Object.keys(fieldLookUp).length > 0) {
            // Item ID
            if (fieldLookUp.itemid && fieldLookUp.itemid.includes(':')) {
              fieldLookUp.itemid = fieldLookUp.itemid.split(': ')[1];
            }
            //

            if (fieldLookUp.custitem5 == '') {
              fieldLookUp.custitem5 = '0';
            }

            if (fieldLookUp.custitem_pcs == '') {
              fieldLookUp.custitem_pcs = '0';
            }

            xmlFile = loopTableData14(xmlFile, fieldLookUp);
          }
          //
        }
      }
      xmlFile += '  </body>\n'; // Closing body tag
      xmlFile += '</pdf>\n'; // Closing pdf tag
      log.debug(
        strLoggerTitle,
        'Remaining governance units: ' + scriptObj.getRemainingUsage()
      );
      //
      log.debug(strLoggerTitle, xmlFile);

      context.response.renderPdf(xmlFile);
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
    let xmlVariable =
      '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">\n';
    xmlVariable += '<pdf>\n';
    xmlVariable += '<head>\n';
    xmlVariable += '    <style type="text/css">*\n';
    xmlVariable += '    table {\n';
    xmlVariable += '        font-size: 9pt;\n';
    xmlVariable += '        margin-top: 10px;\n';
    xmlVariable += '        table-layout: fixed;\n';
    xmlVariable += '        page-break-inside: avoid;\n';
    xmlVariable += '    }\n';
    xmlVariable += '    td p { align:left }\n';
    xmlVariable += '    </style>\n';
    xmlVariable += '</head>\n';
    xmlVariable +=
      '<body width="192px" height="96px" padding="6px" margin="0" font-family="Arial, sans-serif">\n';

    return xmlVariable;
  };
  /* ------------------------------ retrieveXML12 - End ----------------------------- */
  //
  /* -------------------------- retrieveXML14 - Begin ------------------------- */
  const retrieveXML14 = () => {
    let xmlVariable =
      '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">\n';
    xmlVariable += '<pdf>\n';
    xmlVariable += '<head>\n';
    xmlVariable += '    <style type="text/css">*\n';
    xmlVariable += '    table {\n';
    xmlVariable += '        font-size: 9pt;\n';
    xmlVariable += '        margin-top: 10px;\n';
    xmlVariable += '        table-layout: fixed;\n';
    xmlVariable += '        page-break-inside: avoid;\n';
    xmlVariable += '    }\n';
    xmlVariable += '    td p { align:left }\n';
    xmlVariable += '    </style>\n';
    xmlVariable += '</head>\n';
    xmlVariable +=
      '<body width= "4in" height= "2in" padding="10px" font-family= "Arial, sans-serif">\n';

    return xmlVariable;
  };
  /* --------------------------- retrieveXML14 - End -------------------------- */
  //
  /* -------------------------- loopTableData12 - Begin ------------------------- */
  const loopTableData12 = (xmlFile, fieldLookUp) => {
    const strLoggerTitle = 'Loop Table Data 12';
    //
    let xml = xmlFile;
    xml +=
      '<table style="width: 100%; marging: 0; padding:0;  align: center; vertical-align: middle;">\n';
    xml += '<tr padding-top="0">\n';
    xml += '    <td width="75%" padding="0" margin="0">\n';
    xml += '      <table width="100%" margin-top="0">\n';
    xml += '        <tr padding-top="0">\n';
    xml +=
      '          <td align="left" font-size="6pt" padding="0"><b>' +
      fieldLookUp.itemid +
      '</b></td>\n';
    xml += '        </tr>\n';
    xml += '        <tr>\n';
    xml +=
      '          <td align="left" font-size="6pt" padding="0">' +
      fieldLookUp.displayname +
      '</td>\n';
    xml += '        </tr>\n';
    xml += '        <tr>\n';
    xml +=
      '          <td align="left" font-size="6pt" padding="0">' +
      fieldLookUp.custitem_bcc_size +
      '</td>\n';
    xml += '        </tr>\n';
    xml += '        <tr>\n';
    xml += '          <td align="right" padding="0" vertical-align="bottom">\n';
    xml +=
      '            <barcode codetype="code128" style="width: 130px; height: 55px;" showtext="true" value="' +
      fieldLookUp.upccode +
      '"/>\n';
    xml += '          </td>\n';
    xml += '        </tr>\n';
    xml += '      </table>\n';
    xml += '    </td>\n';
    xml += '    <td width="25%" padding="0" margin="0">\n';
    xml += '      <table width="100%" padding="0" margin-top="0">\n';
    xml += '        <tr>\n';
    xml += '          <td align="right" padding="0">\n';
    xml +=
      '            <img src="https://6922326.app.netsuite.com/core/media/media.nl?id=4566&amp;c=6922326&amp;h=QtDyBlQDSXg5fU0PlJzLrqtyV9ajvaZ9EBBnxnALQj9Mo7Yf" style="width:40px; height: 40px; display: block;" />\n';
    xml += '          </td>\n';
    xml += '        </tr>\n';
    xml += '      </table>\n';
    xml += '    </td>\n';
    xml += '  </tr>\n';
    xml += '    </table>\n'; // Closing table tag
    //
    return xml;
  };
  /* --------------------------- loopTableData12 - End -------------------------- */
  //
  /* ------------------------- loopTableData14 - Begin ------------------------ */
  const loopTableData14 = (xmlFile, fieldLookUp) => {
    const strLoggerTitle = 'Loop Table Data 14';
    log.audit(strLoggerTitle, fieldLookUp);
    //
    let xml = xmlFile;
    xml +=
      '<table style="width: 100%; padding: 0px; margin: 0; vertical-align: middle; align: center;">\n';
    xml += '  <tr height="10px">\n';
    xml +=
      '    <td align="left" colspan="1" font-size="10pt"><b>' +
      fieldLookUp.itemid +
      '</b></td>\n';
    xml +=
      '    <td font-size="10pt" align="right"><b>QTY:' +
      fieldLookUp.custitem_pcs +
      '</b></td>\n';
    xml += '  </tr>\n';
    xml += '  <tr height="10px">\n';
    xml +=
      '    <td align="left" colspan="2" font-size="10pt">' +
      fieldLookUp.displayname +
      '</td>\n';
    xml += '  </tr>\n';
    xml += '  <tr height="10px">\n';
    xml +=
      '    <td align="left" colspan="1" font-size="10pt">' +
      fieldLookUp.custitem_bcc_size +
      '</td>\n';
    xml += '  </tr>\n';
    xml += '  <tr>\n';
    xml += '    <td align="center" colspan="2" padding-bottom="0" >\n';
    xml +=
      '      <barcode codetype="code128" style="width: 230px; height: 75px; border: 4px solid #333; corner-radius: 0px;" showtext="false" value="' +
      fieldLookUp.custitem5 +
      '"/>\n';
    xml += '    </td>\n';
    xml += '  </tr>\n';
    xml += '  <tr>\n';
    xml +=
      '    <td align="center" colspan="2" font-size="10pt" padding-bottom="0">' +
      fieldLookUp.custitem5 +
      '</td>\n';
    xml += '  </tr>\n';
    xml += '</table>\n';
    //
    return xml;
  };

  /* ------------------------- loopTableData14 - End ------------------------ */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.onRequest = onRequest;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
