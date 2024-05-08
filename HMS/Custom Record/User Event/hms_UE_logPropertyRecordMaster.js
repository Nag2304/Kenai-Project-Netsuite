/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

/**
 * Fileanme: hms_UE_propertyRecordMaster.js
 * Script: HMS | UE Property Record Master
 * Author           Date       Version               Remarks
 * mikewilliams  2022.12.28    1.00        Initial Creation of Script.
 */

/*global define,log*/

define(['N/record', 'N/format', 'N/search'], (record, format, search) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  const bodyFields = [
    'Client Sales Status',
    'Estimated Closing Date',
    'Current Construction Status',
    'MLS Region 1',
    'MLS Region 2',
    'Builder Division',
    'MLS Sales Status',
    'Top Level Builder',
    'Subdivision Name',
    'Simple Name',
    'Lot Number',
  ];
  const lengthOfBodyFields = bodyFields.length;
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* -------------------------- Before Submit - Begin ------------------------- */
  const beforeSubmit = (scriptContext) => {
    const strLoggerTitle = ' Before Submit';
    const options = {};
    log.audit(
      strLoggerTitle,
      '|>-----------------' + strLoggerTitle + ' - Entry-----------------<|'
    );
    //
    try {
      const propertyRecordNew = scriptContext.newRecord;
      const propertyRecordOld = scriptContext.oldRecord;

      // CLIENT STATUS
      const clientSalesStatusNew = propertyRecordNew.getValue({
        fieldId: 'custrecord_user_entered_sales_status',
      });
      const clientSalesStatusOld = propertyRecordOld.getValue({
        fieldId: 'custrecord_user_entered_sales_status',
      });
      const clientSalesStatusTextNew = propertyRecordNew.getText({
        fieldId: 'custrecord_user_entered_sales_status',
      });
      const clientSalesStatusTextOld = propertyRecordOld.getText({
        fieldId: 'custrecord_user_entered_sales_status',
      });
      options.clientSalesStatusNew = clientSalesStatusNew;
      options.clientSalesStatusOld = clientSalesStatusOld;
      options.clientSalesStatusTextNew = clientSalesStatusTextNew;
      options.clientSalesStatusTextOld = clientSalesStatusTextOld;
      //
      // 2 == pending
      // 3 == closed
      if (clientSalesStatusNew == '2' || clientSalesStatusNew == '3') {
        // ESTIMATED CLOSING DATE -  SUBTAB SALES DETAILS
        options.estimatedClosingDateNew = null;
        options.estimatedClosingDateOld = null;
        if (clientSalesStatusNew == '2') {
          const estimatedClosingDateOld = propertyRecordOld.getValue({
            fieldId: 'custrecord_estimated_closing_date',
          });
          const estimatedClosingDateNew = propertyRecordNew.getValue({
            fieldId: 'custrecord_estimated_closing_date',
          });
          options.estimatedClosingDateOld = format.format({
            value: estimatedClosingDateOld,
            type: format.Type.DATE,
          });
          options.estimatedClosingDateNew = format.format({
            value: estimatedClosingDateNew,
            type: format.Type.DATE,
          });
          //
        }
        //

        // MLS Region 1
        const mlsRegion1TextOld = propertyRecordOld.getText({
          fieldId: 'custrecord15',
        });
        const mlsRegion1TextNew = propertyRecordNew.getText({
          fieldId: 'custrecord15',
        });
        options.mlsRegion1TextOld = mlsRegion1TextOld;
        options.mlsRegion1TextNew = mlsRegion1TextNew;
        let constructionStatusTracked = false;
        if (mlsRegion1TextNew !== mlsRegion1TextOld) {
          const mlsRegion1ValueNew = propertyRecordNew.getValue({
            fieldId: 'custrecord15',
          });
          constructionStatusTracked = search.lookupFields({
            type: search.Type.LOCATION,
            id: mlsRegion1ValueNew,
            columns: ['custrecord_construction_status_tracked'],
          });
          constructionStatusTracked =
            constructionStatusTracked.custrecord_construction_status_tracked;
        }
        //

        // MLS Region 2
        const mlsRegion2TextOld = propertyRecordOld.getText({
          fieldId: 'custrecord16',
        });
        const mlsRegion2TextNew = propertyRecordNew.getText({
          fieldId: 'custrecord16',
        });
        options.mlsRegion2TextOld = mlsRegion2TextOld;
        options.mlsRegion2TextNew = mlsRegion2TextNew;
        //

        // Builder Division
        const builderDivisionTextOld = propertyRecordOld.getText({
          fieldId: 'custrecord12',
        });
        const builderDivisionTextNew = propertyRecordOld.getText({
          fieldId: 'custrecord12',
        });
        options.builderDivisionTextOld = builderDivisionTextOld;
        options.builderDivisionTextNew = builderDivisionTextNew;
        //

        // MLS Sales Status
        const mlsSalesStatusTextOld = propertyRecordOld.getText({
          fieldId: 'custrecord_property_status',
        });
        const mlsSalesStatusTextNew = propertyRecordOld.getText({
          fieldId: 'custrecord_property_status',
        });
        options.mlsSalesStatusTextOld = mlsSalesStatusTextOld;
        options.mlsSalesStatusTextNew = mlsSalesStatusTextNew;
        //

        // Top Level Builder
        const topLevelBuilderTextOld = propertyRecordOld.getText({
          fieldId: 'custrecord_property_status',
        });
        const topLevelBuilderTextNew = propertyRecordOld.getText({
          fieldId: 'custrecord_property_status',
        });
        options.topLevelBuilderTextOld = topLevelBuilderTextOld;
        options.topLevelBuilderTextNew = topLevelBuilderTextNew;
        //

        // SUB DIVSION NAME
        const subDivisionValueOld = propertyRecordOld.getValue({
          fieldId: 'custrecordcustrecordsubdname',
        });
        const subDivisionValueNew = propertyRecordOld.getValue({
          fieldId: 'custrecordcustrecordsubdname',
        });
        options.subDivisionNameNew = null;
        options.subDivisionNameOld = null;
        if (subDivisionValueNew !== subDivisionValueOld) {
          const subDivisionNameNew = search.lookupFields({
            type: search.Type.LOCATION,
            id: subDivisionValueNew,
            columns: ['custrecord_subdivision_id'],
          });
          const subDivisionNameOld = search.lookupFields({
            type: search.Type.LOCATION,
            id: subDivisionValueOld,
            columns: ['custrecord_subdivision_id'],
          });
          options.subDivisionNameNew =
            subDivisionNameNew.custrecord_subdivision_id;
          options.subDivisionNameOld =
            subDivisionNameOld.custrecord_subdivision_id;
        }
        //

        // SIMPLE NAME
        const simpleNameValueOld = propertyRecordOld.getValue({
          fieldId: 'custrecord_simple_name',
        });
        const simpleNameValueNew = propertyRecordOld.getValue({
          fieldId: 'custrecord_simple_name',
        });
        options.simpleNameValueOld = simpleNameValueOld;
        options.simpleNameValueNew = simpleNameValueNew;
        //

        //LOT NUMBER
        const lotNumberValueOld = propertyRecordOld.getValue({
          fieldId: 'custrecord_lot_number',
        });
        const lotNumberValueNew = propertyRecordOld.getValue({
          fieldId: 'custrecord_lot_number',
        });
        options.lotNumberValueOld = lotNumberValueOld;
        options.lotNumberValueNew = lotNumberValueNew;
        //

        // CURRENT STATUS OF CONSTRUCTION - LISTING DETAILS
        options.currentStatusOfConstructionOld = null;
        options.currentStatusOfConstructionNew = null;
        if (constructionStatusTracked) {
          const currentStatusOfConstructionOld = propertyRecordOld.getText({
            fieldId: 'custrecord_current_construction',
          });
          const currentStatusOfConstructionNew = propertyRecordNew.getText({
            fieldId: 'custrecord_current_construction',
          });
          options.currentStatusOfConstructionOld =
            currentStatusOfConstructionOld;
          options.currentStatusOfConstructionNew =
            currentStatusOfConstructionNew;
        }
        //

        // Insert Custom Record
        insertCustomRecord(options);
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
  /* --------------------------- Before Submit - End -------------------------- */
  //
  /* ----------------------- Internal Functions - Begin ----------------------- */
  //
  /* *********************** insertCustomRecord - Begin *********************** */
  /**
   *
   * @param {object} options - contains all the field details
   */
  const insertCustomRecord = (options) => {
    const strLoggerTitle = 'insertCustomRecord';
    let insertSaveFlag = 'N';
    log.audit(
      strLoggerTitle,
      '-------------<< Custom Record Insert - Entry >>-------------'
    );
    //
    try {
      for (let index = 0; index < lengthOfBodyFields; index++) {
        //
        /* -------------------- Creation of Custom Record - Begin ------------------- */
        log.debug(strLoggerTitle, ' Creation of Property Record Change Start');
        const customRec = record.create({
          type: 'customrecord_hms_propertyrecord_changes',
          isDynamic: true,
        });
        // Get Today's Date
        let today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        const yyyy = today.getFullYear();
        today = mm + '/' + dd + '/' + yyyy;
        today = format.parse({
          value: today,
          type: format.Type.DATE,
        });
        customRec.setValue({
          fieldId: 'custrecord_hms_datechanged',
          value: today,
        });
        //
        const fieldChanged = bodyFields[index];
        customRec.setValue({
          fieldId: 'custrecord_hms_fieldchanged',
          value: fieldChanged,
        });
        // Estimated Closing Date
        if (
          fieldChanged === 'Estimated Closing Date' &&
          options.estimatedClosingDateOld !== options.estimatedClosingDateNew
        ) {
          log.debug(
            strLoggerTitle,
            `Estimated Closing Date Old: ${
              options.estimatedClosingDateOld
            } Estimated Closing Date New: ${
              options.estimatedClosingDateNew
            } Comparison: ${
              options.estimatedClosingDateOld !==
              options.estimatedClosingDateNew
            }`
          );
          customRec.setValue({
            fieldId: 'custrecord_hms_oldvalue',
            value: options.estimatedClosingDateOld,
          });
          customRec.setValue({
            fieldId: 'custrecord_hms_newvalue',
            value: options.estimatedClosingDateNew,
          });
          insertSaveFlag = 'Y';
        }
        // Current Status Of Construction
        else if (
          fieldChanged === 'Current Construction Status' &&
          options.currentStatusOfConstructionOld !==
            options.currentStatusOfConstructionNew
        ) {
          log.debug(
            strLoggerTitle,
            'Current Construction Status New: ' +
              options.currentStatusOfConstructionNew +
              ' Current Construction Status Old: ' +
              options.currentStatusOfConstructionOld
          );
          customRec.setValue({
            fieldId: 'custrecord_hms_oldvalue',
            value: options.currentStatusOfConstructionOld,
          });
          customRec.setValue({
            fieldId: 'custrecord_hms_newvalue',
            value: options.currentStatusOfConstructionNew,
          });
          insertSaveFlag = 'Y';
        }
        // Client Sales Status
        else if (
          fieldChanged === 'Client Sales Status' &&
          options.clientSalesStatusNew !== options.clientSalesStatusOld
        ) {
          log.debug(
            strLoggerTitle,
            'Client Sales Status New: ' +
              options.clientSalesStatusNew +
              ' Client Sales Status Old: ' +
              options.clientSalesStatusOld
          );
          customRec.setValue({
            fieldId: 'custrecord_hms_oldvalue',
            value: options.clientSalesStatusTextOld,
          });
          customRec.setValue({
            fieldId: 'custrecord_hms_newvalue',
            value: options.clientSalesStatusTextNew,
          });
          insertSaveFlag = 'Y';
        }
        // MLS Region 1
        else if (
          fieldChanged === 'MLS Region 1' &&
          options.mlsRegion1TextNew !== options.mlsRegion1TextOld
        ) {
          log.debug(
            strLoggerTitle,
            'MLS Region 1 New: ' +
              options.mlsRegion1TextNew +
              ' MLS Region 1 Old: ' +
              options.mlsRegion1TextOld
          );
          customRec.setValue({
            fieldId: 'custrecord_hms_oldvalue',
            value: options.mlsRegion1TextOld,
          });
          customRec.setValue({
            fieldId: 'custrecord_hms_newvalue',
            value: options.mlsRegion1TextNew,
          });
          insertSaveFlag = 'Y';
        } // MLS Region 2
        else if (
          fieldChanged === 'MLS Region 2' &&
          options.mlsRegion2TextOld !== options.mlsRegion2TextNew
        ) {
          log.debug(
            strLoggerTitle,
            'MLS Region 2 New: ' +
              options.mlsRegion2TextNew +
              ' MLS Region 2 Old: ' +
              options.mlsRegion2TextOld
          );
          customRec.setValue({
            fieldId: 'custrecord_hms_oldvalue',
            value: options.mlsRegion2TextOld,
          });
          customRec.setValue({
            fieldId: 'custrecord_hms_newvalue',
            value: options.mlsRegion2TextNew,
          });
          insertSaveFlag = 'Y';
        }
        // Builder Division
        else if (
          fieldChanged === 'Builder Division' &&
          options.builderDivisionTextOld !== options.builderDivisionTextNew
        ) {
          log.debug(
            strLoggerTitle,
            'Builder Division New: ' +
              options.builderDivisionTextNew +
              ' Builder Division Old: ' +
              options.builderDivisionTextOld
          );
          customRec.setValue({
            fieldId: 'custrecord_hms_oldvalue',
            value: options.builderDivisionTextOld,
          });
          customRec.setValue({
            fieldId: 'custrecord_hms_newvalue',
            value: options.builderDivisionTextNew,
          });
          insertSaveFlag = 'Y';
        }
        // Top Level Builder
        else if (
          fieldChanged === 'Top Level Builder' &&
          options.topLevelBuilderTextOld !== options.topLevelBuilderTextNew
        ) {
          log.debug(
            strLoggerTitle,
            'Top Level Builder New: ' +
              options.topLevelBuilderTextNew +
              ' Top Level Builder Old: ' +
              options.topLevelBuilderTextOld
          );
          customRec.setValue({
            fieldId: 'custrecord_hms_oldvalue',
            value: options.topLevelBuilderTextOld,
          });
          customRec.setValue({
            fieldId: 'custrecord_hms_newvalue',
            value: options.topLevelBuilderTextNew,
          });
          insertSaveFlag = 'Y';
        }
        // Sub Division Name
        else if (
          fieldChanged === 'Subdivision Name' &&
          options.subDivisionNameNew !== options.subDivisionNameOld
        ) {
          log.debug(
            strLoggerTitle,
            'Subdivision Name New: ' +
              options.subDivisionNameNew +
              ' Subdivision Name Old: ' +
              options.subDivisionNameOld
          );
          customRec.setValue({
            fieldId: 'custrecord_hms_oldvalue',
            value: options.subDivisionNameOld,
          });
          customRec.setValue({
            fieldId: 'custrecord_hms_newvalue',
            value: options.subDivisionNameNew,
          });
          insertSaveFlag = 'Y';
        }
        // Simple Name
        else if (
          fieldChanged === 'Simple Name' &&
          options.simpleNameValueOld !== options.simpleNameValueNew
        ) {
          log.debug(
            strLoggerTitle,
            'Simple Name New: ' +
              options.simpleNameValueNew +
              ' Simple Name Old: ' +
              options.simpleNameValueOld
          );
          customRec.setValue({
            fieldId: 'custrecord_hms_oldvalue',
            value: options.simpleNameValueOld,
          });
          customRec.setValue({
            fieldId: 'custrecord_hms_newvalue',
            value: options.simpleNameValueNew,
          });
          insertSaveFlag = 'Y';
        }
        // Lot Number
        else if (
          fieldChanged === 'Lot Number' &&
          options.lotNumberValueOld !== options.lotNumberValueNew
        ) {
          log.debug(
            strLoggerTitle,
            'Lot Number New: ' +
              options.lotNumberValueNew +
              ' Lot Number Old: ' +
              options.lotNumberValueOld
          );
          customRec.setValue({
            fieldId: 'custrecord_hms_oldvalue',
            value: options.lotNumberValueOld,
          });
          customRec.setValue({
            fieldId: 'custrecord_hms_newvalue',
            value: options.lotNumberValueNew,
          });
          insertSaveFlag = 'Y';
        }
        // MLS Sales Status
        else if (
          fieldChanged === 'MLS Sales Status' &&
          options.mlsSalesStatusTextOld !== options.mlsSalesStatusTextNew
        ) {
          log.debug(
            strLoggerTitle,
            'MLS Sales Status New: ' +
              options.mlsSalesStatusTextNew +
              ' MLS Sales Status Old: ' +
              options.mlsSalesStatusTextOld
          );
          customRec.setValue({
            fieldId: 'custrecord_hms_oldvalue',
            value: options.mlsSalesStatusTextOld,
          });
          customRec.setValue({
            fieldId: 'custrecord_hms_newvalue',
            value: options.mlsSalesStatusTextNew,
          });
          insertSaveFlag = 'Y';
        }
        //
        /* --------------------- Save the Custom Record - Begin --------------------- */
        // Save the custom record
        if (insertSaveFlag === 'Y') {
          const customRecId = customRec.save();
          insertSaveFlag = 'N';
          log.audit(
            strLoggerTitle,
            'Custom Record Saved Successfully ' + customRecId
          );
        }
        /* --------------------- Save the Custom Record - End --------------------- */
        //
        /* --------------------- Creation of Custom Record - End -------------------- */
        //
      }
    } catch (error) {
      log.error(strLoggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '-------------<< Custom Record Insert - Exit >>-------------'
    );
  };
  /* *********************** insertCustomRecord - End *********************** */
  //
  /* ------------------------ Internal Functions - End ------------------------ */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.beforeSubmit = beforeSubmit;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
