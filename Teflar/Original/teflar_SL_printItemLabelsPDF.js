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
      //
      log.debug(strLoggerTitle, xmlFile);
      //
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
    
        <style type="text/css">* 
        {
            <#if .locale == "zh_CN">
                font-family: NotoSans, NotoSansCJKsc, sans-serif;
            <#elseif .locale == "zh_TW">
                font-family: NotoSans, NotoSansCJKtc, sans-serif;
            <#elseif .locale == "ja_JP">
                font-family: NotoSans, NotoSansCJKjp, sans-serif;
            <#elseif .locale == "ko_KR">
                font-family: NotoSans, NotoSansCJKkr, sans-serif;
            <#elseif .locale == "th_TH">
                font-family: NotoSans, NotoSansThai, sans-serif;
            <#else>
                font-family: NotoSans, sans-serif;
            </#if>
            }
        table {
                font-size: 9pt;
                margin-top: 10px;
                table-layout: fixed;
                page-break-inside: avoid;
            }
        td p { align:left }
    </style>
    </head>
    <body width="192px" height="96px" padding="6px" margin="0" font-family="Arial, sans-serif">
    <table style="width: 100%; marging: 0; padding:0;  align: center; vertical-align: middle;">`;
    return xmlVariable
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };
  /* ------------------------------ retrieveXML12 - End ----------------------------- */
  //
  /* -------------------------- loopTableData - Begin ------------------------- */
  const loopTableData = (xmlFile, fieldLookUp) => {
    let xml = xmlFile;
    xml += '  <!-- codes -->\n';
    xml += '  <tr padding-top="0">\n';
    xml += '    <td width="75%" padding="0" margin="0">\n';
    xml += '      <table width="100%" margin-top="0">\n';
    xml += '        <tr padding-top="0">\n';
    xml +=
      '          <td align="left" font-size="6pt" padding="0"><b>' +
      fieldLookUp.itemid.split(': ')[1] +
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
    return xml;
  };
  /* --------------------------- loopTableData - End -------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.onRequest = onRequest;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
