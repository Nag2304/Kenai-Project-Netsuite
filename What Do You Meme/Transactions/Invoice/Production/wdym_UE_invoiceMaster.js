/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

/*global define,log*/

/**
 * Script Record: WDYM |UE Invoice Master
 * Fileanme: wdym_UE_invoiceMaster.js
 * Author           Date       Version               Remarks
 * Mike Williams  11-07-2022    1.00       Initial creation of the script.
 *
 */
define(['N/record', 'N/runtime', 'N/search'], (record, runtime, search) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* -------------------------- Before Submit - Begin ------------------------- */
  const beforeSubmit = (scriptContext) => {
    /* ------------------------ Intialize Values - Begin ------------------------ */
    const strLoggerTitle = 'Before Submit';
    let scacField = '';
    let scacDescription = '';
    let proNumber = '';
    /* ------------------------ Intialize Values - End ------------------------ */
    //
    try {
      log.debug(
        strLoggerTitle,
        ' Execution Context Type ' + runtime.executionContext
      );
      const invRecord = scriptContext.newRecord;
      if (runtime.executionContext !== runtime.ContextType.USER_INTERFACE) {
        log.debug(
          strLoggerTitle + ' Invoice Record Number',
          ' Document Number' + invRecord.id
        );
        // Get Values
        const createdFromId = parseInt(
          invRecord.getValue({
            fieldId: 'createdfrom',
          })
        );
        //
        log.debug(
          strLoggerTitle + ' Created From Value',
          'Created From ID: ' + createdFromId
        );
        if (createdFromId) {
          /* ----------------------------- Search - Begin ----------------------------- */
          const itemfulfillmentSearchObj = search.create({
            type: 'itemfulfillment',
            filters: [
              ['type', 'anyof', 'ItemShip'],
              'AND',
              ['createdfrom.internalidnumber', 'equalto', createdFromId],
              'AND',
              ['mainline', 'is', 'T'],
            ],
            columns: [
              search.createColumn({
                name: 'custbody_scac',
                label: 'SCAC',
              }),
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
          //
          /* --------------------------- Run Search - Begin --------------------------- */
          itemfulfillmentSearchObj.run().each(function (result) {
            log.audit(strLoggerTitle + ' Saved Search Result', result);
            //
            scacField = result.getValue({
              name: 'custbody_scac',
              label: 'SCAC',
            });
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
          /* --------------------------- Run Search - End --------------------------- */
          //
          /* ------------------------------ Search - End ------------------------------ */
          //
          /* -------------------- Setting the Field Values - Begin -------------------- */
          log.debug(strLoggerTitle, [scacField, scacDescription, proNumber]);
          if (scacField) {
            invRecord.setValue({
              fieldId: 'custbody_wdym_scac_invoice',
              value: scacField,
            });

            log.audit(
              strLoggerTitle + ' SCAC Field',
              ' Setting Value Successfully'
            );
          }

          if (scacDescription) {
            invRecord.setValue({
              fieldId: 'custbody_wdym_scac_desc_invoice',
              value: scacDescription,
            });

            log.audit(
              strLoggerTitle + ' SCAC Description',
              ' Setting Value Successfully'
            );
          }

          if (proNumber) {
            invRecord.setValue({
              fieldId: 'custbody_wdym_pronumb_invoice',
              value: proNumber,
            });
            log.audit(
              strLoggerTitle + ' Pro Number',
              ' Setting Value Successfully'
            );
          }

          /* --------------------- Setting the Field Values - End --------------------- */
          //
        }
      }
      const lineItemCount = invRecord.getLineCount({ sublistId: 'item' });
      for (let i = 0; i < lineItemCount; i++) {
        // Item ID
        const itemId = invRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          line: i,
        });
        //

        // Item Type
        const itemType = invRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'itemtype',
          line: i,
        });
        //

        let itemFields;
        if (itemType == 'InvtPart') {
          itemFields = search.lookupFields({
            type: search.Type.INVENTORY_ITEM,
            id: itemId,
            columns: ['custitem_master_carton_gtin_number'],
          });
          const masterCarton = itemFields['custitem_master_carton_gtin_number'];

          log.debug(strLoggerTitle, ' Master Carton: ' + masterCarton);

          if (masterCarton) {
            invRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_wdym_gtin',
              value: masterCarton,
              line: i,
            });
          }
        }
      }
    } catch (error) {
      log.audit(strLoggerTitle + ' failed to execute the script', error);
    }
  };
  /* --------------------------- Before Submit - End -------------------------- */
  //
  /* -------------------------- After Submit - Begin -------------------------- */
  const afterSubmit = (scriptContext) => {
    const strLoggerTitle = 'After Submit';

    log.debug(strLoggerTitle, '|>--------------Entry--------------<|');
    try {
      const invoiceRecordInternalId = scriptContext.newRecord.id;

      if (invoiceRecordInternalId) {
        const invoiceRecord = record.load({
          type: record.Type.INVOICE,
          id: invoiceRecordInternalId,
        });

        log.debug(
          strLoggerTitle,
          'Invoice Record Loaded Successfully ' + invoiceRecordInternalId
        );

        // Get ShipDate
        const shipDate = invoiceRecord.getValue({ fieldId: 'shipdate' });

        // Set Invoice Date
        if (shipDate) {
          invoiceRecord.setValue({ fieldId: 'trandate', value: shipDate });
        }

        // Save the invoice record
        invoiceRecord.save();
        log.audit(strLoggerTitle, ' Invoice Record Saved Successfully');
        //
      }
      //
    } catch (error) {
      log.error(strLoggerTitle + ' caught an exception', error);
    }
    log.debug(strLoggerTitle, '|>--------------Exit--------------<|');
  };
  /* --------------------------- After Sumbit - End --------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.beforeSubmit = beforeSubmit;
  exports.afterSubmit = afterSubmit;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
