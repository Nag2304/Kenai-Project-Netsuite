/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */

/* global define,log */

/**
 * Fileanme: wdym_CS_soMaster.js
 * Author           Date       Version               Remarks
 * nagendrababu   2022.01.12    1.00       This is the Module Script for Client.
 */

define(['N/record', 'N/search'], function (record, search) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  var makeMandatory = false;
  /* ------------------------ Global Variables - End ------------------------ */
  //
  /* --------------------------- Field Changed - Begin -------------------------- */
  function fieldChanged(scriptContext) {
    var strLoggerTitle = 'Field Changed';
    try {
      var currentRecord = scriptContext.currentRecord;
      var sublistName = scriptContext.sublistId;
      var sublistFieldName = scriptContext.fieldId;
      //
      if (sublistName === 'item' && sublistFieldName === 'isclosed') {
        var isclosed = currentRecord.getCurrentSublistValue({
          sublistId: sublistName,
          fieldId: 'isclosed',
        });
        if (isclosed === 'T' || isclosed === true) {
          makeMandatory = true;
        }
      }
    } catch (err) {
      log.audit(strLoggerTitle + ' Failed to Execute', err);
    }
  }
  /* --------------------------- Field Changed - End -------------------------- */
  //
  /* ---------------------------- Validate Line Begin --------------------------- */
  function validateLine(scriptContext) {
    try {
      var currentRecord = scriptContext.currentRecord;
      var sublistId = scriptContext.sublistId;
      var itemId;
      if (sublistId == 'item') {
        itemId = currentRecord.getCurrentSublistValue({
          sublistId: sublistId,
          fieldId: 'item',
        });
      }

      if (itemId == '' || itemId == null || itemId == 'Nan') return true;

      var customerId = currentRecord.getValue({ fieldId: 'entity' });

      var fieldLookup = search.lookupFields({
        type: search.Type.CUSTOMER,
        id: customerId,
        columns: ['category', 'companyname', 'pricelevel'],
      });

      var category = fieldLookup.category[0].value;

      var companyName = fieldLookup.companyname;

      var priceLevelCustomerRecord;
      if (fieldLookup.pricelevel.length) {
        priceLevelCustomerRecord = fieldLookup.pricelevel[0].text;
      }

      log.debug('field look up', [
        category,
        companyName,
        priceLevelCustomerRecord,
      ]);

      if (priceLevelCustomerRecord) {
        companyName = companyName.toUpperCase();
        var itemType = currentRecord.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'itemtype',
        });

        var quantity = currentRecord.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
        });
        //console.log(quantity, itemType);
        var recItem;
        log.debug('item values', [itemType, recItem, itemId]);
        if (itemType == 'InvtPart') {
          recItem = record.load({
            type: record.Type.INVENTORY_ITEM,
            id: itemId,
          });
        } else if (itemType == 'NonInvtPart') {
          recItem = record.load({
            type: record.Type.NON_INVENTORY_ITEM,
            id: itemId,
          });
        } else if (itemType == 'Service') {
          recItem = record.load({
            type: record.Type.SERVICE_ITEM,
            id: itemId,
          });
        } else if (itemType == 'Assembly') {
          recItem = record.load({
            type: record.Type.ASSEMBLY_ITEM,
            id: itemId,
          });
        }
        //log.debug('item record', recItem);
        if (recItem) {
          /* ----------------------- Retrieve Price Logic Begin ----------------------- */
          var lineCount = recItem.getLineCount({ sublistId: 'price1' });
          //
          /* ---------------------------- Line Count Begin ---------------------------- */
          var itemPrice;
          //if the customer category is international and there is no customer specific price then FOB price.

          for (var i = 0; i < lineCount; i++) {
            var itemCustName = recItem
              .getSublistValue({
                sublistId: 'price1',
                fieldId: 'pricelevelname',
                line: i,
              })
              .toUpperCase();

            if (itemCustName == priceLevelCustomerRecord.toUpperCase()) {
              log.audit('item customer name', [
                itemCustName,
                priceLevelCustomerRecord,
              ]);
              //

              itemPrice = recItem.getSublistValue({
                sublistId: 'price1',
                fieldId: 'price_1_',
                line: i,
              });

              log.audit('item Price in if condition', [quantity, itemPrice]);
              break;
            }
          }
          log.debug('item price', 'Item price from Item record ' + itemPrice);
          //
          //Fetch FOB price
          if (!itemPrice) {
            for (var j = 0; j < lineCount; j++) {
              var itemCustNameFob = recItem.getSublistValue({
                sublistId: 'price1',
                fieldId: 'pricelevelname',
                line: j,
              });

              if (itemCustNameFob === 'FOB price' && category === '6') {
                itemPrice = recItem.getSublistValue({
                  sublistId: 'price1',
                  fieldId: 'price_1_',
                  line: j,
                });

                break;
              }
            }
            log.debug('item price', 'Item price from FOB Price ' + itemPrice);
          }

          if (itemPrice) {
            currentRecord.setCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_wdym_customer_price',
              value: itemPrice,
              ignoreFieldChange: false,
            });
          }
          //
          /* ---------------------------- Line Count Begin ---------------------------- */
          //
          /* ----------------------- Retrieve Price Logic End----------------------- */
          //
        }
      }
      //
      /* ----------------------- Close Reason Logic - Begin ----------------------- */
      // Check for the field
      var closeReason = currentRecord.getCurrentSublistValue({
        sublistId: 'item',
        fieldId: 'custcol_wdym_cancel_reason',
      });
      if (
        closeReason === null ||
        closeReason === undefined ||
        closeReason === ' ' ||
        closeReason === '' ||
        isNaN(closeReason)
      ) {
        alert('Please Select a Cancel Reason.');
        return false;
      } else {
        currentRecord.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'isclosed',
          value: true,
          ignoreFieldChange: false,
        });
        return true;
      }
      /* ------------------------ Close Reason Logic - End ------------------------ */
      //
    } catch (err) {
      log.debug('Script Caused Faiure', err);
    }

    return true;
  }
  /* ---------------------------- Validate Line End --------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.validateLine = validateLine;
  exports.fieldChanged = fieldChanged;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
