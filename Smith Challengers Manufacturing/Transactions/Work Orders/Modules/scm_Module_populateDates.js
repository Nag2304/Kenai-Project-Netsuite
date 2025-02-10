/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: scm_Module_populateDates.js
 * Author           Date       Version               Remarks
 * nagendrababu 02.10.2025       1.00       Intial creation of the script
 *
 */

/* global define,log */

define(['N/search', 'N/format'], (search, format) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Populate Dates - Begin ------------------------- */
  const populateDates = (context, workOrder) => {
    const loggerTitle = ' Populate Dates ';
    log.debug(
      loggerTitle,
      `|>-------------------${loggerTitle} - Entry-------------------<|`
    );
    //
    try {
      if (context.type !== context.UserEventType.CREATE) {
        log.debug(loggerTitle, 'This is event not type create.');
        return;
      }

      const createdFromId = workOrder.getValue({ fieldId: 'createdfrom' });
      if (!createdFromId) {
        log.debug(
          loggerTitle,
          'This Work Order is not linked to another record.'
        );
        return;
      }

      const createdFromText = workOrder.getText({ fieldId: 'createdfrom' });
      if (!createdFromText || !createdFromText.includes('Sales Order')) {
        log.debug(
          loggerTitle,
          'The Work Order was not created from a Sales Order.'
        );
        return;
      }

      const salesOrderFields = search.lookupFields({
        type: search.Type.SALES_ORDER,
        id: createdFromId,
        columns: ['shipdate'],
      });

      const shipDate = salesOrderFields.shipdate;
      log.debug(loggerTitle, `Ship Date: ${shipDate}`);

      const shipDateObj = format.parse({
        value: shipDate,
        type: format.Type.DATE,
      });

      const startDateObj = new Date(shipDateObj);
      startDateObj.setDate(shipDateObj.getDate() - 7); // Subtract 7 days

      log.debug(loggerTitle, startDateObj);

      const formattedStartDate = format.parse({
        value: format.format({
          value: startDateObj,
          type: format.Type.DATE,
        }),
        type: format.Type.DATE,
      });

      const formattedEndDate = format.parse({
        value: format.format({
          value: shipDateObj,
          type: format.Type.DATE,
        }),
        type: format.Type.DATE,
      });
      log.debug(
        loggerTitle,
        `Start Date: ${formattedStartDate} End Date: ${formattedEndDate}`
      );

      workOrder.setValue({ fieldId: 'startdate', value: formattedStartDate });
      workOrder.setValue({ fieldId: 'enddate', value: formattedEndDate });

      log.audit(
        loggerTitle,
        'Production Start Date and End Date set successfully.'
      );
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    //
    log.debug(
      loggerTitle,
      `|>-------------------${loggerTitle} - Exit-------------------<|`
    );
    return true;
  };
  /* ------------------------- Populate Dates - End ------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.afterSubmit = populateDates;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
