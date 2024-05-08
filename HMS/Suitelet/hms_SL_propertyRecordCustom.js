/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */

/*global define,log*/
define(['N/search', 'N/runtime', 'N/ui/serverWidget'], function (
  search,
  runtime,
  ui
) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ---------------------------- onRequest - Begin --------------------------- */
  const onRequest = (context) => {
    const strLoggerTitle = 'On Request';
    const userObj = runtime.getCurrentUser();
    log.audit(
      strLoggerTitle,
      '|>--------------' + strLoggerTitle + ' - Entry--------------<|'
    );
    //
    try {
      //
      /* --------------------------- Create Form - Begin -------------------------- */
      // Create form
      const form = ui.createForm({
        title: 'Property Record Custom',
      });
      //
      /* ------------------------------ Fields Begin ------------------------------ */
      // ***Container: Primary Information - Begin
      const primaryInformation = form.addFieldGroup({
        id: 'primaryinformation',
        label: 'Primary Information',
      });
      // Add Property select field
      const propertyField = form.addField({
        id: 'custpage_property_field',
        label: 'Property Field',
        type: ui.FieldType.SELECT,
        container: 'primaryinformation',
      });
      setPropertyField(propertyField);
      propertyField.updateBreakType({
        breakType: ui.FieldBreakType.STARTROW,
      });
      propertyField.updateDisplayType({
        displayType: ui.FieldDisplayType.NORMAL,
      });
      //
      // Sub Division Name
      const subDivisionName = form.addField({
        id: 'custpage_subdivision_name',
        label: 'Sub Division Name',
        type: ui.FieldType.TEXT,
      });
      subDivisionName.updateDisplayType({
        displayType: ui.FieldDisplayType.DISABLED,
      });
      //
      // Subdivision Abr
      const subDivisionAbbrevation = form.addField({
        id: 'custpage_subdivision_abbr',
        label: 'Sub Division Abbreviation',
        type: ui.FieldType.TEXT,
      });
      subDivisionAbbrevation.updateDisplayType({
        displayType: ui.FieldDisplayType.DISABLED,
      });
      //
      // Lot Number
      const lotNumber = form.addField({
        id: 'custpage_lot_number',
        label: 'Lot Number',
        type: ui.FieldType.TEXT,
      });
      lotNumber.updateDisplayType({
        displayType: ui.FieldDisplayType.DISABLED,
      });
      //
      // Current Construction Status
      const currentConstructionStatus = form.addField({
        id: 'custpage_current_construction_status',
        label: 'Current Construction Status',
        type: ui.FieldType.TEXT,
      });
      currentConstructionStatus.updateDisplayType({
        displayType: ui.FieldDisplayType.DISABLED,
      });
      //
      // Builder Division
      const builderDivision = form.addField({
        id: 'custpage_builder_division',
        label: 'Builder Division',
        type: ui.FieldType.TEXT,
      });
      builderDivision.updateDisplayType({
        displayType: ui.FieldDisplayType.DISABLED,
      });
      builderDivision.updateBreakType({
        breakType: ui.FieldBreakType.STARTCOL,
      });
      //
      // MLS Sales Status
      const mLSSalesStatus = form.addField({
        id: 'custpage_mls_sales_sstatus',
        label: 'MLS Sales Status',
        type: ui.FieldType.TEXT,
      });
      mLSSalesStatus.updateDisplayType({
        displayType: ui.FieldDisplayType.DISABLED,
      });
      //
      // MLS Region 1
      const mLSRegion1 = form.addField({
        id: 'custpage_mls_region1',
        label: 'MLS Region 1',
        type: ui.FieldType.TEXT,
      });
      mLSRegion1.updateDisplayType({
        displayType: ui.FieldDisplayType.DISABLED,
      });
      //
      // MLS Region 2
      const mLSRegion2 = form.addField({
        id: 'custpage_mls_region2',
        label: 'MLS Region 2',
        type: ui.FieldType.TEXT,
      });
      mLSRegion2.updateDisplayType({
        displayType: ui.FieldDisplayType.DISABLED,
      });
      //
      // Assigned To
      const assignedTo = form.addField({
        id: 'custpage_assigned_to',
        label: 'Assigned To',
        type: ui.FieldType.TEXT,
      });
      assignedTo.defaultValue = userObj.name;
      //
      // ***Container: Primary Information - End
      //
      // ***Container: Caller Information - Begin
      const callerInformation = form.addFieldGroup({
        id: 'callerinformation',
        label: 'Caller Information',
      });
      // ***Container: Caller Information - End
      //
      /* ------------------------------ Fields End ------------------------------ */
      //
      /* --------------------------- Create Form - End -------------------------- */
      //
      /* --------------------------- Write Form - Begin --------------------------- */
      // Return form to user
      context.response.writePage(form);
      /* --------------------------- Write Form - End --------------------------- */
      //
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
  /* ----------------------- Internal Functions - Begin ----------------------- */
  //
  /*  *********************** setPropertyField - Begin  *********************** */
  /**
   *
   * @param {Object} propertyField
   * @returns {boolean}
   */
  const setPropertyField = (propertyField) => {
    const strLoggerTitle = 'Set Property Field';
    log.audit(
      strLoggerTitle,
      '|>--------------' + strLoggerTitle + ' - Entry--------------<|'
    );
    //
    try {
      propertyField.addSelectOption({
        value: '',
        text: '',
      });
      //
      /* -------------------------- Create Search - Begin ------------------------- */
      // Create Columns
      const internalId = search.createColumn({ name: 'internalid' });
      const name = search.createColumn({
        name: 'name',
        sort: search.Sort.ASC,
      });
      //
      const propertyrecordSearch = search.create({
        type: 'customrecord_property_record',
        filters: [['custrecord_property_status', 'anyof', '1', '2']],
        columns: [internalId, name],
      });
      /* -------------------------- Create Search - End ------------------------- */
      //
      /* --------------------------- Run Search - Begin --------------------------- */
      const searchResultCount = propertyrecordSearch.runPaged().count;
      /* ---------------------------- Run Search - End ---------------------------- */
      //
      /* --------------------------- Get Results - Begin -------------------------- */
      propertyrecordSearch.run().each(function (result) {
        // .run().each has a limit of 4,000 results
        const internalId = result.getValue({ name: 'internalid' });
        const name = result.getValue({ name: 'name', sort: search.Sort.ASC });
        propertyField.addSelectOption({
          value: internalId,
          text: name,
        });
        return true;
      });
      /* --------------------------- Get Results - End -------------------------- */
      //
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>--------------' + strLoggerTitle + ' - Exit--------------<|'
    );
    return true;
  };
  /*  *********************** setPropertyField - End  *********************** */
  //
  /* ----------------------- Internal Functions - End ----------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.onRequest = onRequest;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
