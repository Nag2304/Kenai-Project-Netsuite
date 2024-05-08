/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */

/* global define,log */

/**
 * Fileanme: wdym_CS_itemReceiptMaster.js
 * Script Name: Acclaro | CS Item Receipt Master
 * Author           Date       Version               Remarks
 * mikewilliams   01.12.2023    1.00       Initial Creation of the script
 */

define(['N/record'], function (record) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  var exports = {};
  /* ------------------------ Global Variables - End ------------------------ */
  //
  /* ---------------------------- pageInit - Begin ---------------------------- */
  function pageInit(scriptContext) {
    var strLoggerTitle = ' Page Init ';
    log.audit(
      strLoggerTitle,
      '|>-----------------' + strLoggerTitle + ' - Entry-----------------<|'
    );
    //
    var itemReceiptRecord = scriptContext.currentRecord;

    var createdFrom = itemReceiptRecord.getValue({
      fieldId: 'createdfrom',
    });
    log.debug(strLoggerTitle + ' Created From', createdFrom);
    try {
      //
      if (createdFrom) {
        //
        /* ---------------------- Purchase Order Record - Begin --------------------- */
        var poLineItemsArray = [];
        var poLineItemsObject = {};
        var purchaseOrderRecordLoad = record.load({
          type: record.Type.PURCHASE_ORDER,
          id: createdFrom,
          isDynamic: false,
        });
        var poLineCount = purchaseOrderRecordLoad.getLineCount({
          sublistId: 'item',
        });
        for (var index = 0; index < poLineCount; index++) {
          poLineItemsObject.itemId = purchaseOrderRecordLoad.getSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: index,
          });
          poLineItemsObject.line = index + 1;
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
        var itemReceiptRecordLineCount = itemReceiptRecord.getLineCount({
          sublistId: 'item',
        });
        var poLineItemsArrayLength = poLineItemsArray.length;

        log.debug(strLoggerTitle + ' Array Object', poLineItemsArray);

        if (itemReceiptRecordLineCount === poLineItemsArrayLength) {
          log.debug(
            strLoggerTitle,
            ' Array count and item Receipt record line count matches'
          );
          for (var index2 = 0; index2 < itemReceiptRecordLineCount; index2++) {
            log.debug(strLoggerTitle, 'Line Selected ' + index2);
            var itemReceiptItemId = itemReceiptRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'item',
              line: index2,
            });
            log.debug(
              strLoggerTitle,
              ' item receipt Item id ' +
                itemReceiptItemId +
                ' Array Item ID ' +
                poLineItemsArray[index2].itemId
            );
            // Set the Expected Receive Date
            if (itemReceiptItemId === poLineItemsArray[index2].itemId) {
              itemReceiptRecord.selectLine({
                sublistId: 'item',
                line: index2,
              });
              itemReceiptRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcolexpectedreceiptdate',
                value: poLineItemsArray[index2].expectedReceiveDate,
              });
              log.debug(
                strLoggerTitle + ' Setting the value',
                'Line ' + index2 + ' Value successfully set'
              );
              itemReceiptRecord.commitLine({
                sublistId: 'item',
              });
            }
            //
          }
        } else {
          log.debug(
            strLoggerTitle,
            'Array count and item Receipt record line count not matches'
          );
          log.audit(
            strLoggerTitle + ' Array Count Of Objects for not matching',
            poLineItemsArrayLength
          );
          for (var index3 = 0; index3 < itemReceiptRecordLineCount; index3++) {
            var orderLine = itemReceiptRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'orderline',
              line: index3,
            });

            var foundObject = {};
            foundObject = poLineItemsArray.find(function (poLineItemObject) {
              return poLineItemObject.line == orderLine;
            });

            log.debug(
              strLoggerTitle +
                ' Line Object Found for the order line ' +
                orderLine,
              foundObject
            );
            if (foundObject && Object.keys(foundObject).length > 0) {
              log.debug(
                strLoggerTitle +
                  ' Line Object Found for the order line ' +
                  orderLine,
                Object.values(foundObject)
              );

              itemReceiptRecord.selectLine({
                sublistId: 'item',
                line: index3,
              });
              itemReceiptRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcolexpectedreceiptdate',
                value: foundObject.expectedReceiveDate,
              });
              log.debug(
                strLoggerTitle + ' Setting the value',
                'Line ' + index3 + ' Value successfully set'
              );
              itemReceiptRecord.commitLine({
                sublistId: 'item',
              });
            }
          }
        }
        //
      }
    } catch (error) {
      log.error(
        strLoggerTitle + ' caught an exception for the PO ID ' + createdFrom,
        error
      );
    }
    //
    log.audit(
      strLoggerTitle,
      '|>-----------------' + strLoggerTitle + ' - Exit-----------------<|'
    );
  }
  /* ----------------------------- pageInit - End ----------------------------- */
  //
  /* ------------------------ Helper Functions - Begin ------------------------ */
  /* ------------------------- Helper Functions - End ------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.pageInit = pageInit;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
  //
});
