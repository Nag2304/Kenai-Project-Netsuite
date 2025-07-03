/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

/**
 * File name: wdym_Module_setPoExFactoryDate.js
 * Author           Date       Version               Remarks
 * nagendrababu  06.28.2025     1.00        Initial creation of the script
 *
 */

/* global define,log */

define(['N/search', 'N/format'], (search, format) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  const WHQ_LOCATION_ID = '115';
  const TBF_LOCATION_ID = '1';
  const FIELD_WHQ_LEADTIME = 'custentity_whq_lead_time';
  const FIELD_TBF_LEADTIME = 'custentity_tbf_lead_time';
  const FIELD_EX_FACTORY_DATE = 'custbody_ex_factory_date';
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ---------------------- Set PO Exfactory Date - Begin --------------------- */
  const setPOExFactoryDate = (context) => {
    const loggerTitle = 'Set PO Ex Factory Date';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const eventType = context.type;
      if (
        eventType !== context.UserEventType.CREATE &&
        eventType !== context.UserEventType.EDIT
      ) {
        return;
      }
      const newRec = context.newRecord;
      const oldRec = context.oldRecord;

      const receiveByDate = newRec.getValue('duedate');
      if (!receiveByDate) {
        log.debug(loggerTitle, 'No Receive By date set');
        return false;
      }

      const itemLineCount = newRec.getLineCount({ sublistId: 'item' });
      if (itemLineCount === 0) {
        log.debug(loggerTitle, 'No item lines');
        return false;
      }

      const locationId = newRec.getSublistValue({
        sublistId: 'item',
        fieldId: 'location',
        line: 0,
      });

      if (!locationId) {
        log.debug(loggerTitle, 'No location found on line 1');
        return false;
      } else {
        log.debug(loggerTitle, 'Location: ' + locationId);
      }

      // Check if duedate or line 1 location changed
      const isFieldChanged =
        context.type === context.UserEventType.CREATE ||
        !oldRec ||
        newRec.getValue('duedate') !== oldRec.getValue('duedate') ||
        locationId !==
          oldRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'location',
            line: 0,
          });

      if (!isFieldChanged) {
        log.debug(loggerTitle, 'Neither Receive By date nor Location changed');
        return false;
      }

      const vendorId = newRec.getValue('entity');
      if (!vendorId) {
        log.debug(loggerTitle, 'No vendor');
        return false;
      }

      // Load lead times from vendor record
      const vendorFields = search.lookupFields({
        type: search.Type.VENDOR,
        id: vendorId,
        columns: [FIELD_WHQ_LEADTIME, FIELD_TBF_LEADTIME],
      });
      log.debug(loggerTitle + ' Vendor Fields', vendorFields);

      let leadDays = 0;
      if (
        locationId.toString() === WHQ_LOCATION_ID &&
        vendorFields[FIELD_WHQ_LEADTIME]?.length
      ) {
        leadDays = parseInt(vendorFields[FIELD_WHQ_LEADTIME][0].text, 10);
      } else if (
        locationId.toString() === TBF_LOCATION_ID &&
        vendorFields[FIELD_TBF_LEADTIME]?.length
      ) {
        leadDays = parseInt(vendorFields[FIELD_TBF_LEADTIME][0].text, 10);
      }
      if (!leadDays || isNaN(leadDays)) {
        log.debug(
          loggerTitle,
          'No valid lead time found for this location/vendor combo'
        );
        return false;
      }

      const exFactoryDate = new Date(receiveByDate);
      exFactoryDate.setDate(exFactoryDate.getDate() - leadDays);

      // No need to format date before setting it
      newRec.setValue({
        fieldId: FIELD_EX_FACTORY_DATE,
        value: exFactoryDate,
      });

      const logDate = format.format({
        value: exFactoryDate,
        type: format.Type.DATE,
      });

      log.audit(
        loggerTitle,
        `Ex Factory Date Updated',
        Set to ${logDate} based on location ${locationId} and lead time ${leadDays} days`
      );
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return true;
  };
  /* ---------------------- Set PO Exfactory Date - End --------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = setPOExFactoryDate;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
