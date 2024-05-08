/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

/**
 * Fileanme: acclaro_UE_itemReceiptMaster.js
 * Script: ACC | UE Item Receipt Master
 * Author           Date       Version               Remarks
 * mikewilliams  2023.01.11    1.00        Initial Creation of Script.
 * mikewilliams  2023.01.12    1.01        Added runtime module to execute other than user interface
 */

/*global define,log*/
define(['N/record', 'N/runtime'], (record, runtime) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* -------------------------- beforeSubmit - Begin -------------------------- */
  /**
   *
   * @param {object} scriptContext
   */
  const beforeSubmit = (scriptContext) => {
    const strLoggerTitle = ' Before Submit';
    log.audit(
      strLoggerTitle,
      '|>-----------------' + strLoggerTitle + ' - Entry-----------------<|'
    );
    //
    log.audit(
      strLoggerTitle + ' Context Type',
      ' Context Type ' + scriptContext.type
    );
    try {
      if (runtime.executionContext !== runtime.ContextType.USER_INTERFACE) {
        const itemReceiptRecordNew = scriptContext.newRecord;

        const createdFrom = itemReceiptRecordNew.getValue({
          fieldId: 'createdfrom',
        });
        log.debug(strLoggerTitle + ' Created From', createdFrom);

        if (createdFrom) {
          //
          /* ---------------------- Purchase Order Record - Begin --------------------- */
          const poLineItemsArray = [];
          let poLineItemsObject = {};
          const purchaseOrderRecordLoad = record.load({
            type: record.Type.PURCHASE_ORDER,
            id: createdFrom,
            isDynamic: false,
          });
          const poLineCount = purchaseOrderRecordLoad.getLineCount({
            sublistId: 'item',
          });
          for (let index = 0; index < poLineCount; index++) {
            poLineItemsObject.itemId = purchaseOrderRecordLoad.getSublistValue({
              sublistId: 'item',
              fieldId: 'item',
              line: index,
            });
            poLineItemsObject.expectedReceiveDate =
              purchaseOrderRecordLoad.getSublistValue({
                sublistId: 'item',
                fieldId: 'expectedreceiptdate',
                line: index,
              });
            poLineItemsArray.push(poLineItemsObject);
            poLineItemsObject = {};
          }
          /* ---------------------- Purchase Order Record - End --------------------- */
          //
          const itemReceiptRecordLineCount = itemReceiptRecordNew.getLineCount({
            sublistId: 'item',
          });
          const poLineItemsArrayLength = poLineItemsArray.length;

          if (itemReceiptRecordLineCount === poLineItemsArrayLength) {
            for (
              let index2 = 0;
              index2 < itemReceiptRecordLineCount;
              index2++
            ) {
              const itemReceiptItemId = itemReceiptRecordNew.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: index2,
              });

              // Set the Expected Receive Date
              if (itemReceiptItemId === poLineItemsArray[index2].itemId) {
                itemReceiptRecordNew.setSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcolexpectedreceiptdate',
                  value: poLineItemsArray[index2].expectedReceiveDate,
                  line: index2,
                });
              }
              //
            }
          } else {
            for (
              let index3 = 0;
              index3 < itemReceiptRecordLineCount;
              index3++
            ) {
              const orderLine = itemReceiptRecordNew.getSublistValue({
                sublistId: 'item',
                fieldId: 'orderline',
                line: index3,
              });

              const foundObject = poLineItemsArray.find(
                (poLineItemObject) => poLineItemObject.line == orderLine
              );

              if (foundObject && Object.keys(foundObject).length > 0) {
                itemReceiptRecordNew.setSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcolexpectedreceiptdate',
                  value: foundObject.expectedReceiveDate,
                  line: index3,
                });
              }
            }
          }
        }
        //
      }
    } catch (error) {
      log.error(strLoggerTitle + ' caught an exception', error);
    }

    //
    log.audit(
      strLoggerTitle,
      '|>-----------------' + strLoggerTitle + ' - Exit-----------------<|'
    );
  };
  /* --------------------------- beforeSubmit - End --------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.beforeSubmit = beforeSubmit;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
  //
});
