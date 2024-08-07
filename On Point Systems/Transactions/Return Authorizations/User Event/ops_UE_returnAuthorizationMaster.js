/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

/**
 * Fileanme: ops_UE_returnAuthorizationMaster.js
 * Script: OPS | UE Return Authorization Master
 * Author           Date       Version               Remarks
 * mikewilliams  2022.12.28    1.00        Initial Creation of Script.
 */

/*global define,log*/

define(['N/format', 'N/record'], (format, record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------ Global Variables - End ------------------------ */
  //
  /* --------------------------- afterSubmit - Begin -------------------------- */
  const afterSubmit = (scriptContext) => {
    const strLoggerTitle = 'After Submit';
    log.audit(
      strLoggerTitle,
      '|>-----------------' +
        strLoggerTitle +
        ' : Function - Entry-----------------<|'
    );
    //
    try {
      let returnAuthorizationRecord = scriptContext.newRecord;
      // Get Internal ID
      const returnAuthId = returnAuthorizationRecord.id;
      //

      returnAuthorizationRecord = record.load({
        type: record.Type.RETURN_AUTHORIZATION,
        id: returnAuthId,
      });

      const customerId = returnAuthorizationRecord.getValue({
        fieldId: 'entity',
      });

      if (customerId === '220554' || customerId === '1187553') {
        log.audit(strLoggerTitle, ' Customer is Amazon so do not process');
      } else {
        let returnAuthStatus = returnAuthorizationRecord.getValue({
          fieldId: 'status',
        });
        const createdFromId = returnAuthorizationRecord.getValue({
          fieldId: 'createdfrom',
        });

        log.audit(
          strLoggerTitle + ' Transaction Body Values',
          `Created From ID: ${createdFromId} Return Authorization Status: ${returnAuthStatus}`
        );

        // Status == Pending Receipt && Created From Id is not null
        if (returnAuthStatus === 'Pending Receipt' && createdFromId) {
          // Item Receipt Transaction Form and Credit Memo Transaction Form
          if (returnAuthId) {
            const returnAuthDate = returnAuthorizationRecord.getValue({
              fieldId: 'trandate',
            });
            //
            /* ------------------- Item Receipt Transformation - Begin ------------------ */
            const itemReceiptRecord = record.transform({
              fromType: 'returnauthorization',
              fromId: returnAuthId,
              toType: 'itemreceipt',
              isDynamic: true,
            });

            itemReceiptRecord.setValue({
              fieldId: 'trandate',
              value: returnAuthDate,
            });
            itemReceiptRecord.setValue({
              fieldId: 'custbody_atlas_inspectedby',
              value: 14,
            });

            const itemReceiptRecordInternalId = itemReceiptRecord.save();
            log.audit(
              strLoggerTitle + ' Item Receipt Record Saved',
              `Item Receipt Record Saved Successfully ${itemReceiptRecordInternalId}`
            );
            /* ------------------- Item Receipt Transformation - End ------------------ */
            //
            // Check Current status of Return Authorization
            returnAuthStatus = returnAuthorizationRecord.getValue({
              fieldId: 'status',
            });
            log.audit(
              strLoggerTitle + ' Current RA Status',
              `Current RA Status: ${returnAuthStatus}`
            );
            //if (returnAuthStatus === 'Pending Refund') {
            /* ------------------- Credit Memo Transformation - Begin ------------------- */
            const creditMemoRecord = record.transform({
              fromType: 'returnauthorization',
              fromId: returnAuthId,
              toType: 'creditmemo',
              isDynamic: true,
            });
            creditMemoRecord.setValue({
              fieldId: 'trandate',
              value: returnAuthDate,
            });
            const creditMemoRecordInternalId = creditMemoRecord.save();
            log.audit(
              strLoggerTitle + ' Credit Memo Record Saved',
              `Credit Memo Record Saved Successfully ${creditMemoRecordInternalId}`
            );
            /* -------------------- Credit Memo Transformation - End -------------------- */
            // }
          }
          //
          //returnAuthorizationRecord.save();
          log.audit(
            strLoggerTitle + ' RA Record Saved',
            `RA Record Saved Successfully ${returnAuthId}`
          );
        }
      }
      //
    } catch (error) {
      log.error(strLoggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>-----------------' +
        strLoggerTitle +
        ' : Function - Exit-----------------<|'
    );
  };
  /* ---------------------------- afterSubmit - End --------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.afterSubmit = afterSubmit;
  return exports;
  /* ----------------------------- Exports - End ---------------------------- */
});
