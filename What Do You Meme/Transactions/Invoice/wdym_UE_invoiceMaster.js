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
  /* -------------------------- Before Load - Begin ------------------------- */
  const beforeLoad = (scriptContext) => {
    const loggerTitle = ' Before Load ';
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Begin ----------------<|'
    );
    //
    try {
      if (scriptContext.type !== scriptContext.UserEventType.VIEW) {
        return;
      }
      //
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- End ----------------<|'
    );
  };
  /* -------------------------- Before Load - End------------------------- */
  //
  /* -------------------------- Before Submit - Begin ------------------------- */
  const beforeSubmit = (scriptContext) => {
    /* ------------------------ Intialize Values - Begin ------------------------ */
    const loggerTitle = 'Before Submit';
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- Begin ----------------<|'
    );
    let scacField = '';
    let scacDescription = '';
    let proNumber = '';
    let itemfulfillmentWeight = '';
    let caseShipped = '';
    let totalUnitsShipped = '';
    /* ------------------------ Intialize Values - End ------------------------ */
    //
    try {
      log.debug(
        loggerTitle,
        ' Execution Context Type ' + runtime.executionContext
      );
      //
      const invRecord = scriptContext.newRecord;

      log.debug(
        loggerTitle + ' Invoice Record Number',
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
        loggerTitle + ' Created From Value',
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
              label: 'PRO Number',
            }),
            search.createColumn({
              name: 'custbody_wdym_if_weight',
              label: 'Item Fullfillment Weight',
            }),
            search.createColumn({
              name: 'custbody_wdym_units_shipped',
              label: 'Units Shipped',
            }),
          ],
        });
        //
        /* --------------------------- Run Search - Begin --------------------------- */
        itemfulfillmentSearchObj.run().each(function (result) {
          log.audit(loggerTitle + ' Saved Search Result', result);
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
          itemfulfillmentWeight = result.getValue({
            name: 'custbody_wdym_if_weight',
            label: 'Item Fullfillment Weight ',
          });
          // caseShipped = result.getValue({
          //   name: 'custbody_cases_shipped',
          //   label: 'Cases Shipped',
          // });
          totalUnitsShipped = result.getValue({
            name: 'custbody_wdym_units_shipped',
            label: 'Units Shipped',
          });
          return true;
        });
        /* --------------------------- Run Search - End --------------------------- */
        //
        /* ------------------------------ Search - End ------------------------------ */
        //
        /* -------------------- Setting the Field Values - Begin -------------------- */
        log.debug(loggerTitle, [scacField, scacDescription, proNumber]);
        if (scacField) {
          invRecord.setValue({
            fieldId: 'custbody_wdym_scac_invoice',
            value: scacField,
          });

          log.audit(loggerTitle + ' SCAC Field', ' Setting Value Successfully');
        }

        if (scacDescription) {
          invRecord.setValue({
            fieldId: 'custbody_wdym_scac_desc_invoice',
            value: scacDescription,
          });

          log.audit(
            loggerTitle + ' SCAC Description',
            ' Setting Value Successfully'
          );
        }

        if (proNumber) {
          invRecord.setValue({
            fieldId: 'custbody_wdym_pronumb_invoice',
            value: proNumber,
          });
          log.audit(loggerTitle + ' Pro Number', ' Setting Value Successfully');
        }

        if (itemfulfillmentWeight) {
          invRecord.setValue({
            fieldId: 'custbody_wdym_if_weight',
            value: itemfulfillmentWeight,
          });
          log.audit(
            loggerTitle + ' Item Fulfillment Weight',
            ' Setting Value Successfully'
          );
        }

        if (caseShipped) {
          invRecord.setValue({
            fieldId: 'custbody_cases_shipped',
            value: caseShipped,
          });
          log.audit(
            loggerTitle + ' Cases Shipped',
            ' Setting Value Successfully'
          );
        }
        if (totalUnitsShipped) {
          invRecord.setValue({
            fieldId: 'custbody_wdym_units_shipped',
            value: totalUnitsShipped,
          });
        }
        /* --------------------- Setting the Field Values - End --------------------- */
        //
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

          log.debug(loggerTitle, ' Master Carton: ' + masterCarton);

          if (masterCarton) {
            invRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_gtin',
              value: masterCarton,
              line: i,
            });
          }
        }
      }
    } catch (error) {
      log.audit(loggerTitle + ' failed to execute the script', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>----------------' + loggerTitle + '- End ----------------<|'
    );
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
  exports.beforeLoad = beforeLoad;
  exports.beforeSubmit = beforeSubmit;
  exports.afterSubmit = afterSubmit;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
