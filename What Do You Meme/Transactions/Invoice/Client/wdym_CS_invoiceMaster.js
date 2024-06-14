/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */

/* global define,log */

/**
 * Fileanme: wdym_CS_invoiceMaster.js
 * Script Name: WDYM | CS Invoice Master
 * Author           Date       Version               Remarks
 * nagendrababu  06.14.2024     1.00          Initial creation of script
 */

define(['N/currentRecord', 'N/search'], function (currentRecord, search) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  var exports = {};
  /* ------------------------ Global Variables - End ------------------------ */
  //
  /* ----------------------------- Page Init Begin ---------------------------- */
  /**
   *
   * @param {object} scriptContext
   */
  function pageInit(scriptContext) {
    var loggerTitle = 'Page Init ';
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Begin ----------------<|'
    );
    //
    try {
      var scacField = '';
      var scacDescription = '';
      var proNumber = '';
      //
      var newRecord = currentRecord.get();
      var createdFromId = parseInt(
        newRecord.getValue({
          fieldId: 'createdfrom',
        })
      );
      //
      if (createdFromId) {
        var itemfulfillmentSearchObj = search.create({
          type: 'itemfulfillment',
          filters: [
            ['type', 'anyof', 'ItemShip'],
            'AND',
            ['createdfrom.internalidnumber', 'equalto', createdFromId],
            'AND',
            ['mainline', 'is', 'T'],
          ],
          columns: [
            search.createColumn({ name: 'custbody_scac', label: 'SCAC' }),
            search.createColumn({
              name: 'custbody_scac_description',
              label: 'SCAC Description',
            }),
            search.createColumn({
              name: 'custbody_pro_nbr',
              label: 'PRO Number ',
            }),
          ],
        });

        itemfulfillmentSearchObj.run().each(function (result) {
          scacField = result.getValue({ name: 'custbody_scac', label: 'SCAC' });
          scacDescription = result.getValue({
            name: 'custbody_scac_description',
            label: 'SCAC Description',
          });
          proNumber = result.getValue({
            name: 'custbody_pro_nbr',
            label: 'PRO Number ',
          });
          return true;
        });
        //
        log.debug(loggerTitle, [scacField, scacDescription, proNumber]);
        newRecord.setValue({
          fieldId: 'custbody_wdym_scac_invoice',
          value: scacField,
        });
        newRecord.setValue({
          fieldId: 'custbody_wdym_scac_desc_invoice',
          value: scacDescription,
        });
        newRecord.setValue({
          fieldId: 'custbody_wdym_pronumb_invoice',
          value: proNumber,
        });
      } else {
        log.debug(
          loggerTitle + ' Created From Internal ID',
          'Created From Internal ID: ' + createdFromId
        );
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- End ----------------<|'
    );
    return true;
  }
  /* ------------------------------ Page Init End ----------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.pageInit = pageInit;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
