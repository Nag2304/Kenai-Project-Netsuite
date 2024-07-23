/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

/**
 * Fileanme: hms_UE_propertyRecordMaster.js
 * Script: HMS | UE Property Record Master
 * Author           Date       Version               Remarks
 * mikewilliams  2023.01.10    1.00        Initial Creation of Script.
 */

/*global define,log*/

define(['N/record', 'N/format', 'N/search', 'N/url'], (
  record,
  format,
  search,
  url
) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  const bodyFields = [
    'Client Sales Status',
    'Estimated Closing Date',
    'Current Construction Status',
    'Contract Approval Date',
    'Buyer Name',
    'Primary Agent Name',
    'Sapphire Address',
  ];
  const lengthOfBodyFields = bodyFields.length;
  const options = {};
  /* ------------------------ Global Variables - End ------------------------ */
  //
  /* -------------------------- Before Submit - Begin ------------------------- */
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
      if (scriptContext.type !== scriptContext.UserEventType.CREATE) {
        const propertyRecordNew = scriptContext.newRecord;
        const propertyRecordOld = scriptContext.oldRecord;

        options.internalId = propertyRecordNew.id;
        options.propertyName = propertyRecordNew.getValue({ fieldId: 'name' });

        // MLS NUMBER REGION - 1
        const mlsNumberRegion1 = propertyRecordNew.getValue({
          fieldId: 'custrecord_mls_number_region1',
        });
        options.mlsNumberRegion1 = mlsNumberRegion1;
        //

        // CONTRACT APPROVAL DATE
        const contractApprovalDateNew = propertyRecordNew.getValue({
          fieldId: 'custrecord_contract_approval_date',
        });
        const contractApprovalDateOld = propertyRecordOld.getValue({
          fieldId: 'custrecord_contract_approval_date',
        });
        options.contractApprovalDateNew = null;
        if (contractApprovalDateNew) {
          options.contractApprovalDateNew = format.format({
            value: contractApprovalDateNew,
            type: format.Type.DATE,
          });
        }
        options.contractApprovalDateOld = null;
        if (contractApprovalDateOld) {
          options.contractApprovalDateOld = format.format({
            value: contractApprovalDateOld,
            type: format.Type.DATE,
          });
        }
        //

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
        log.debug(
          strLoggerTitle + ' Client Sales Status',
          ' Client Sales Status ' +
            clientSalesStatusTextNew +
            ' Client Sales Status Value ' +
            clientSalesStatusNew
        );
        // if (clientSalesStatusNew === '2' || clientSalesStatusNew === '3') {
        log.debug(strLoggerTitle, ' If condition passed');
        // ESTIMATED CLOSING DATE -  SUBTAB SALES DETAILS
        options.estimatedClosingDateNew = null;
        options.estimatedClosingDateOld = null;

        const estimatedClosingDateOld = propertyRecordOld.getValue({
          fieldId: 'custrecord_estimated_closing_date',
        });
        const estimatedClosingDateNew = propertyRecordNew.getValue({
          fieldId: 'custrecord_estimated_closing_date',
        });
        if (estimatedClosingDateOld) {
          options.estimatedClosingDateOld = format.format({
            value: estimatedClosingDateOld,
            type: format.Type.DATE,
          });
        }

        if (estimatedClosingDateNew) {
          options.estimatedClosingDateNew = format.format({
            value: estimatedClosingDateNew,
            type: format.Type.DATE,
          });
        }

        //
        // MLS Region 1
        const mlsRegion1ValueNew = propertyRecordNew.getValue({
          fieldId: 'custrecord15',
        });
        const mlsRegion1Status = checkConstructionStatus(mlsRegion1ValueNew);
        options.mlsRegion1StatusConstructionStatusTracked =
          mlsRegion1Status.constructionStatusTracked;
        options.mlsRegion1StatusestimatedClosingDateTracked =
          mlsRegion1Status.estimatedClosingDateTracked;
        options.mlsRegion1ValueNew = mlsRegion1ValueNew;
        //

        // MLS Region 2
        const mlsRegion2ValueNew = propertyRecordNew.getValue({
          fieldId: 'custrecord16',
        });
        const mlsRegion2Status = checkConstructionStatus(mlsRegion2ValueNew);
        options.mlsRegion2StatusConstructionStatusTracked =
          mlsRegion2Status.constructionStatusTracked;
        options.mlsRegion2StatusestimatedClosingDateTracked =
          mlsRegion2Status.estimatedClosingDateTracked;
        options.mlsRegion2ValueNew = mlsRegion2ValueNew;
        //

        // Builder Division
        const builderDivisionValueNew = propertyRecordOld.getValue({
          fieldId: 'custrecord12',
        });
        options.builderDivisionValueNew = builderDivisionValueNew;
        //

        // Top Level Builder
        const topLevelBuilderValueNew = propertyRecordOld.getValue({
          fieldId: 'custrecord_top_level_builder',
        });
        options.topLevelBuilderValueNew = topLevelBuilderValueNew;
        //

        // MLS Sales Status
        const mlsSalesStatusValueNew = propertyRecordOld.getValue({
          fieldId: 'custrecord_property_status',
        });
        options.mlsSalesStatusValueNew = mlsSalesStatusValueNew;
        //

        // SIMPLE NAME
        const simpleNameValueNew = propertyRecordOld.getValue({
          fieldId: 'custrecord_simple_name',
        });
        options.simpleNameValueNew = simpleNameValueNew;
        //

        //LOT NUMBER
        const lotNumberValueNew = propertyRecordOld.getValue({
          fieldId: 'custrecord_lot_number',
        });
        options.lotNumberValueNew = lotNumberValueNew;
        //

        // SUB DIVSION NAME
        const subDivisionValueNew = propertyRecordOld.getValue({
          fieldId: 'custrecordcustrecordsubdname',
        });
        let subDivisionNameNew;
        if (subDivisionValueNew) {
          const fieldLookUpForSubDivision = search.lookupFields({
            type: 'customrecord_subdivision',
            id: subDivisionValueNew,
            columns: ['custrecord_subdivision_id'],
          });
          subDivisionNameNew =
            fieldLookUpForSubDivision.custrecord_subdivision_id;
        }
        options.subDivisionNameNew = subDivisionNameNew;
        //

        // CURRENT STATUS OF CONSTRUCTION - LISTING DETAILS
        options.currentStatusOfConstructionOld = null;
        options.currentStatusOfConstructionNew = null;
        const currentStatusOfConstructionOld = propertyRecordOld.getText({
          fieldId: 'custrecord_current_construction',
        });
        const currentStatusOfConstructionNew = propertyRecordNew.getText({
          fieldId: 'custrecord_current_construction',
        });
        options.currentStatusOfConstructionOld = currentStatusOfConstructionOld;
        options.currentStatusOfConstructionNew = currentStatusOfConstructionNew;
        //

        // Buyer Name
        const buyerNameNew = propertyRecordNew.getValue({
          fieldId: 'custrecord_buyers_last_name',
        });
        const buyerNameOld = propertyRecordOld.getValue({
          fieldId: 'custrecord_buyers_last_name',
        });
        options.buyerNameNew = buyerNameNew;
        options.buyerNameOld = buyerNameOld;

        // Primary Agent Name
        const primaryAgentNameNew = propertyRecordNew.getValue({
          fieldId: 'custrecord_agent_name_sn',
        });
        const primaryAgentNameOld = propertyRecordOld.getValue({
          fieldId: 'custrecord_agent_name_sn',
        });
        options.primaryAgentNameNew = primaryAgentNameNew;
        options.primaryAgentNameOld = primaryAgentNameOld;
        //

        //SAPPHIRE ADDRESS
        const sapphireAddressNew = propertyRecordNew.getValue({
          fieldId: 'custrecord100',
        });
        const sapphireAddressOld = propertyRecordOld.getValue({
          fieldId: 'custrecord100',
        });
        options.sapphireAddressNew = sapphireAddressNew;
        options.sapphireAddressOld = sapphireAddressOld;
        //

        /* -------------- Call Custom Record Insert - Function - Begin -------------- */
        log.debug(strLoggerTitle + ' Options Object', options);
        insertCustomRecord(options);
        /* -------------- Call Custom Record Insert - Function - End -------------- */
        //

        //
        // }
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
  /* -------------------------- After Submit - Begin ------------------------- */
  const afterSubmit = (scriptContext) => {
    const loggerTitle = 'After Submit';
    log.audit(
      loggerTitle,
      '|>-----------------' + loggerTitle + ' - Entry-----------------<|'
    );
    //
    try {
      const propertyRecordId = scriptContext.newRecord.id;
      const propertyRecord = record.load({
        type: 'customrecord_property_record',
        id: propertyRecordId,
      });
      //
      // const mlsStatus = propertyRecord.getValue({
      //   fieldId: 'custrecord_property_status',
      // });
      // const clientStatus = propertyRecord.getValue({
      //   fieldId: 'custrecord_user_entered_sales_status',
      // });

      // log.debug(loggerTitle, { mlsStatus, clientStatus });

      // if (mlsStatus !== clientStatus) {
      //   propertyRecord.setValue({
      //     fieldId: 'custrecord_user_entered_sales_status',
      //     value: mlsStatus,
      //   });
      //   log.debug(loggerTitle, 'Client status updated successfully');
      // }
      //
      log.debug(loggerTitle, options);
      if (options.estimatedClosingDateOld) {
        propertyRecord.setValue({
          fieldId: 'custrecord_hms_oldvalue',
          value: options.estimatedClosingDateOld,
        });
      } else if (options.currentStatusOfConstructionOld) {
        propertyRecord.setValue({
          fieldId: 'custrecord_hms_oldvalue',
          value: options.currentStatusOfConstructionOld,
        });
      } else if (options.clientSalesStatusOld) {
        propertyRecord.setValue({
          fieldId: 'custrecord_hms_oldvalue',
          value: options.clientSalesStatusOld,
        });
      }

      propertyRecord.save();
      log.audit(loggerTitle, 'Property Record Saved Successfully');
      //
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-----------------' + loggerTitle + ' - Exit-----------------<|'
    );
  };
  /* -------------------------- After Submit - End ------------------------- */
  //
  /* -------------------------- Helper Functions- Begin ------------------------- */
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

        // Field Changed
        const fieldChanged = bodyFields[index];
        customRec.setValue({
          fieldId: 'custrecord_hms_fieldchanged',
          value: fieldChanged,
        });
        //

        // Set the name field
        const scheme = 'https://';
        const host = url.resolveDomain({
          hostType: url.HostType.APPLICATION,
        });
        const otherRecordLink = url.resolveRecord({
          recordType: 'customrecord_property_record',
          recordId: options.internalId,
          isEditMode: false,
        });
        const myURL = scheme + host + otherRecordLink;
        //const link = '<a href="' + myURL + '">' + options.propertyName + '</a>';
        customRec.setValue({
          fieldId: 'custrecord_hms_url_name',
          value: myURL,
        });

        // Builder Division
        customRec.setValue({
          fieldId: 'custrecord_hms_builder_division',
          value: options.builderDivisionValueNew,
        });
        //

        // MLS Number Region - 1
        customRec.setValue({
          fieldId: 'custrecord_hms__mls_number_region1',
          value: options.mlsNumberRegion1,
        });

        // MLS Sales Status
        customRec.setValue({
          fieldId: 'custrecord_hms_mls_sales_status',
          value: options.mlsSalesStatusValueNew,
        });
        if (options.mlsSalesStatusValueNew == '3') {
          customRec.setValue({
            fieldId: 'isinactive',
            value: true,
          });
        }
        //

        // Top Level Builder
        customRec.setValue({
          fieldId: 'custrecord_hms_top_level_builder',
          value: options.topLevelBuilderValueNew,
        });
        //

        // Subdivision Name
        customRec.setValue({
          fieldId: 'custrecord_hms_subdivision_name',
          value: options.subDivisionNameNew,
        });
        //

        // Simple Name
        customRec.setValue({
          fieldId: 'custrecord_hms_simplename',
          value: options.simpleNameValueNew,
        });
        //

        // Lot Number
        customRec.setValue({
          fieldId: 'custrecord_hms_lot_number',
          value: options.lotNumberValueNew,
        });
        //

        // Internal ID
        customRec.setValue({
          fieldId: 'custrecord_hms_propertyrecord_id',
          value: options.internalId,
        });
        //

        // Estimated Closing Date
        if (
          fieldChanged === 'Estimated Closing Date' &&
          options.estimatedClosingDateOld &&
          options.estimatedClosingDateNew &&
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
          log.debug(
            strLoggerTitle,
            'Estimated Closing Date: ' + options.estimatedClosingDateOld
          );
          customRec.setValue({
            fieldId: 'custrecord_hms_oldvalue',
            value: options.estimatedClosingDateOld,
          });
          customRec.setValue({
            fieldId: 'custrecord_hms_newvalue',
            value: options.estimatedClosingDateNew,
          });

          if (
            options.mlsRegion1StatusestimatedClosingDateTracked &&
            options.mlsRegion1ValueNew
          ) {
            customRec.setValue({
              fieldId: 'custrecord_hms_mlsregion1',
              value: options.mlsRegion1ValueNew,
            });
          }

          if (
            options.mlsRegion2StatusestimatedClosingDateTracked &&
            options.mlsRegion2ValueNew
          ) {
            customRec.setValue({
              fieldId: 'custrecord_hms_mlsregion2',
              value: options.mlsRegion2ValueNew,
            });
          }

          insertSaveFlag = 'Y';
        }
        // Current Status Of Construction
        else if (
          fieldChanged === 'Current Construction Status' &&
          options.currentStatusOfConstructionOld &&
          options.currentStatusOfConstructionNew &&
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

          if (
            options.mlsRegion1StatusConstructionStatusTracked &&
            options.mlsRegion1ValueNew
          ) {
            customRec.setValue({
              fieldId: 'custrecord_hms_mlsregion1',
              value: options.mlsRegion1ValueNew,
            });
          }

          if (
            options.mlsRegion2StatusConstructionStatusTracked &&
            options.mlsRegion2ValueNew
          ) {
            customRec.setValue({
              fieldId: 'custrecord_hms_mlsregion2',
              value: options.mlsRegion2ValueNew,
            });
          }

          insertSaveFlag = 'Y';
        }
        // Client Sales Status
        else if (
          fieldChanged === 'Client Sales Status' &&
          options.clientSalesStatusOld &&
          options.clientSalesStatusNew &&
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
        // Contract Approval Date
        else if (
          fieldChanged === 'Contract Approval Date' &&
          options.contractApprovalDateOld &&
          options.contractApprovalDateNew &&
          options.contractApprovalDateOld !== options.contractApprovalDateNew
        ) {
          log.debug(
            strLoggerTitle,
            ' Contract Approval Date New: ' +
              options.contractApprovalDateNew +
              ' Contract Approval Date Old:' +
              options.contractApprovalDateOld
          );
          customRec.setValue({
            fieldId: 'custrecord_hms_oldvalue',
            value: options.contractApprovalDateOld,
          });
          customRec.setValue({
            fieldId: 'custrecord_hms_newvalue',
            value: options.contractApprovalDateNew,
          });
          insertSaveFlag = 'Y';
        }
        // Buyer Name
        else if (
          fieldChanged === 'Buyer Name' &&
          options.buyerNameNew &&
          options.buyerNameOld &&
          options.buyerNameNew !== options.buyerNameOld
        ) {
          log.debug(
            strLoggerTitle,
            ' Buyer Name New: ' +
              options.buyerNameNew +
              ' Buyer Name Old:' +
              options.buyerNameOld
          );
          customRec.setValue({
            fieldId: 'custrecord_hms_oldvalue',
            value: options.buyerNameOld,
          });
          customRec.setValue({
            fieldId: 'custrecord_hms_newvalue',
            value: options.buyerNameNew,
          });
          insertSaveFlag = 'Y';
        }
        // Primary Agent Name
        else if (
          fieldChanged === 'Primary Agent Name' &&
          options.primaryAgentNameNew &&
          options.primaryAgentNameOld &&
          options.primaryAgentNameNew !== options.primaryAgentNameOld
        ) {
          log.debug(
            strLoggerTitle,
            ' Primary Agent Name New: ' +
              options.primaryAgentNameNew +
              ' Primary Agent Name Old:' +
              options.primaryAgentNameOld
          );
          customRec.setValue({
            fieldId: 'custrecord_hms_oldvalue',
            value: options.primaryAgentNameOld,
          });
          customRec.setValue({
            fieldId: 'custrecord_hms_newvalue',
            value: options.primaryAgentNameNew,
          });
          insertSaveFlag = 'Y';
        }
        //
        // Sapphire Address
        else if (
          fieldChanged === 'Sapphire Address' &&
          options.sapphireAddressNew &&
          options.sapphireAddressOld &&
          options.sapphireAddressNew !== options.sapphireAddressOld
        ) {
          log.debug(
            strLoggerTitle,
            ' Sapphire Address New: ' +
              options.sapphireAddressNew +
              ' Sapphire Address Old:' +
              options.sapphireAddressOld
          );
          customRec.setValue({
            fieldId: 'custrecord_hms_oldvalue',
            value: options.sapphireAddressOld,
          });
          customRec.setValue({
            fieldId: 'custrecord_hms_newvalue',
            value: options.sapphireAddressNew,
          });
          insertSaveFlag = 'Y';
        }
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
        /* -------------------- Creation of Custom Record - End ------------------- */
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
  /* *********************** checkConstructionStatus - Begin *********************** */
  /**
   *
   * @param {string} mlsRegionValue
   * @returns
   */
  const checkConstructionStatus = (mlsRegionValue) => {
    const strLoggerTitle = 'checkConstructionStatus';
    log.audit(
      strLoggerTitle,
      '-------------<< checkConstructionStatus - Entry >>-------------'
    );
    //
    try {
      if (mlsRegionValue) {
        const fieldLookUpforLocation = search.lookupFields({
          type: search.Type.LOCATION,
          id: mlsRegionValue,
          columns: [
            'custrecord_construction_status_tracked',
            'custrecord_estimated_closing_date_tracke',
          ],
        });

        const constructionStatusTracked =
          fieldLookUpforLocation.custrecord_construction_status_tracked;
        const estimatedClosingDateTracked =
          fieldLookUpforLocation.custrecord_estimated_closing_date_tracke;
        //
        log.audit(
          strLoggerTitle,
          '-------------<< checkConstructionStatus - Exit >>-------------'
        );
        return {
          constructionStatusTracked,
          estimatedClosingDateTracked,
        };
      }
    } catch (error) {
      log.error(strLoggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '-------------<< checkConstructionStatus - Exit >>-------------'
    );
    //
    return {
      constructionStatusTracked: false,
      estimatedClosingDateTracked: false,
    };
  };
  /* *********************** checkConstructionStatus - End *********************** */
  //
  /* ------------------------ Helper Functions - End ------------------------ */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.beforeSubmit = beforeSubmit;
  //exports.afterSubmit = afterSubmit;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
