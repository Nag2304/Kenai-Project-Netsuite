/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
/*global define,log*/
define(['N/search'], function (search) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  var exports = {};
  var type = '';
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* --------------------------- pageInit - Begin -------------------------- */
  function pageInit(scriptContext) {
    var strLoggerTitle = 'Page Init';
    log.debug(strLoggerTitle, '|>------------------Entry------------------<|');
    //
    type = scriptContext.mode;
    if (scriptContext.mode === 'edit') {
      var newRecord = scriptContext.currentRecord;
      var discLineNumber = newRecord.findSublistLineWithValue({
        sublistId: 'item',
        fieldId: 'itemtype',
        value: 'Discount',
      });
      log.debug(strLoggerTitle, 'Discount Line Number ' + discLineNumber);

      if (discLineNumber !== -1) {
        newRecord.removeLine({
          sublistId: 'item',
          line: discLineNumber,
          ignoreRecalc: true,
        });
      }
    }
    //
    log.debug(strLoggerTitle, '|>------------------Exit------------------<|');
  }
  /* --------------------------- pageInit - End -------------------------- */
  //
  /* -------------------------- FieldChanged - Begin -------------------------- */
  function fieldChanged(scriptContext) {
    var strLoggerTitle = 'Field Changed';
    log.debug(strLoggerTitle, '|>------------------Entry------------------<|');
    try {
      var currentRecord = scriptContext.currentRecord;
      var fieldId = scriptContext.fieldId;

      // Only execute in edit mode
      if (type !== 'edit') {
        log.debug(strLoggerTitle, 'Skipping: Not in edit mode');
        return;
      }

      // Handle changes to Receive By Date (duedate)
      if (fieldId === 'duedate') {
        var receiveByDate = currentRecord.getValue({
          fieldId: 'duedate',
        });

        if (!receiveByDate) {
          log.debug(strLoggerTitle, 'No Receive By Date set');
          return;
        }

        // Get location from the first item line
        var locationId = currentRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'location',
          line: 0,
        });

        if (!locationId) {
          log.debug(strLoggerTitle, 'No location found on line 1');
          return;
        }

        // Get vendor ID
        var vendorId = currentRecord.getValue({
          fieldId: 'entity',
        });

        if (!vendorId) {
          log.debug(strLoggerTitle, 'No vendor selected');
          return;
        }

        // Use N/search to lookup vendor lead times
        var vendorFields = search.lookupFields({
          type: search.Type.VENDOR,
          id: vendorId,
          columns: ['custentity_whq_lead_time', 'custentity_tbf_lead_time'],
        });

        var leadDays = 0;
        if (
          locationId === '115' &&
          vendorFields.custentity_whq_lead_time &&
          vendorFields.custentity_whq_lead_time.length
        ) {
          leadDays = parseInt(
            vendorFields.custentity_whq_lead_time[0].text,
            10
          );
        } else if (
          locationId === '1' &&
          vendorFields.custentity_tbf_lead_time &&
          vendorFields.custentity_tbf_lead_time.length
        ) {
          leadDays = parseInt(
            vendorFields.custentity_tbf_lead_time[0].text,
            10
          );
        }

        if (!leadDays || isNaN(leadDays)) {
          log.debug(
            strLoggerTitle,
            'No valid lead time found for this location/vendor combo'
          );
          return;
        }

        // Calculate Ex-Factory Date
        var exFactoryDate = new Date(receiveByDate);
        exFactoryDate.setDate(exFactoryDate.getDate() - leadDays);

        // Set Ex-Factory Date
        currentRecord.setValue({
          fieldId: 'custbody_ex_factory_date',
          value: exFactoryDate,
        });

        log.audit(
          strLoggerTitle,
          'Ex-Factory Date set to ' +
            exFactoryDate +
            ' based on lead time ' +
            leadDays +
            ' days'
        );
      }

      // Handle manual changes to Ex-Factory Date and update Receive By Date if checkbox is true
      if (fieldId === 'custbody_ex_factory_date') {
        log.debug(strLoggerTitle, 'Ex-Factory Date manually updated');
        var updateRecByDate = currentRecord.getValue({
          fieldId: 'custbody_wdym_update_rec_date',
        });
        if (updateRecByDate) {
          var exFactoryDate = currentRecord.getValue({
            fieldId: 'custbody_ex_factory_date',
          });
          var newReceiveByDate = new Date(exFactoryDate);
          newReceiveByDate.setDate(newReceiveByDate.getDate() + leadDays);
          currentRecord.setValue({
            fieldId: 'duedate',
            value: newReceiveByDate,
          });
          log.audit(
            strLoggerTitle,
            'Receive By Date updated to ' +
              newReceiveByDate +
              ' based on Ex-Factory Date and lead time ' +
              leadDays +
              ' days'
          );
        }
      }
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    log.debug(strLoggerTitle, '|>------------------Exit------------------<|');
  }
  /* --------------------------- FieldChanged - End --------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.pageInit = pageInit;
  exports.fieldChanged = fieldChanged;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
