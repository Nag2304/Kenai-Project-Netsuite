/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
/*global define,log*/
define(['N/record', 'N/search'], (record, search) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* --------------------------- Before Load - Begin -------------------------- */
  const beforeLoad = (context) => {
    const strLoggerTitle = ' Before Load ';
    log.audit(
      strLoggerTitle,
      '|>----------------' + strLoggerTitle + '-Entry----------------<|'
    );
    //
    try {
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>----------------' + strLoggerTitle + '-Exit----------------<|'
    );
  };
  /* ---------------------------- Before Load - End --------------------------- */
  //
  /* -------------------------- Before Submit - Begin ------------------------- */
  const beforeSubmit = (context) => {
    const strLoggerTitle = ' Before Submit ';
    log.audit(
      strLoggerTitle,
      '|>----------------' + strLoggerTitle + '-Entry----------------<|'
    );
    //
    try {
      const customerDepositRecord = context.newRecord;
      const account = customerDepositRecord.getValue({ fieldId: 'account' });

      const accountRecordSearch = search.lookupFields({
        type: search.Type.ACCOUNT,
        id: account,
        columns: ['type'],
      });
      const accountType = accountRecordSearch.type[0].value;

      if (accountType === 'Bank') {
        customerDepositRecord.setValue({
          fieldId: 'custbody_wdym_exp_account',
          value: 426,
        });
      }
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>----------------' + strLoggerTitle + '-Exit----------------<|'
    );
  };
  /* --------------------------- Before Submit - End -------------------------- */
  //
  /* -------------------------- After Submit - Begin -------------------------- */
  const afterSubmit = (context) => {
    const strLoggerTitle = ' After Submit ';
    const options = {};
    log.audit(
      strLoggerTitle,
      '|>----------------' + strLoggerTitle + '-Entry----------------<|'
    );
    //
    try {
      const customerDepositRecord = context.newRecord;

      const customerDepositRecordId = customerDepositRecord.id;

      const cdRecord = record.load({
        type: record.Type.CUSTOMER_DEPOSIT,
        id: customerDepositRecordId,
      });

      // const customerDepositDocumentNumber = cdRecord.getValue({
      //   fieldId: 'tranid',
      // });

      // HREF
      const href =
        'https://4994827-sb1.app.netsuite.com/app/accounting/transactions/custdep.nl?id=' +
        customerDepositRecordId +
        '&whence=';
      options.href = href;
      //

      // Expense Account
      const expenseAccount = parseInt(
        customerDepositRecord.getValue({
          fieldId: 'custbody_wdym_exp_account',
        })
      );
      options.expenseAccount = expenseAccount;
      //

      // Expense Amount
      const expenseAmount = customerDepositRecord.getValue({
        fieldId: 'custbody_wdym_exp_amount',
      });
      options.expenseAmount = expenseAmount;
      //

      // Account
      const account = parseInt(
        customerDepositRecord.getValue({ fieldId: 'account' })
      );
      options.account = account;
      //

      // Date
      const date = customerDepositRecord.getValue({ fieldId: 'trandate' });
      options.date = date;
      //

      const jeCreated = customerDepositRecord.getValue({
        fieldId: 'custbody_wdym_je_created',
      });

      log.audit(strLoggerTitle + ' Transaction Body Values ', {
        expenseAccount: expenseAccount,
        expenseAmount: expenseAmount,
        account: account,
        transactionDate: date,
        jeCreated: jeCreated,
        hyperLinkText: href,
      });

      //
      /* ----------------------- Edit Journal Entry - Begin ----------------------- */
      if (context.type === context.UserEventType.EDIT) {
        editJournalRecord(context, cdRecord, customerDepositRecordId);
      }
      /* ----------------------- Edit Journal Entry - End ----------------------- */
      //

      //
      /* ---------------------- Create Journal Entry - Begin ---------------------- */
      if (context.type === context.UserEventType.CREATE) {
        if (expenseAccount && !jeCreated) {
          const journalEntryId = createJournalRecord(options);
          // Set the JE Created
          if (journalEntryId) {
            cdRecord.setValue({
              fieldId: 'custbody_wdym_je_created',
              value: true,
            });
          }
        }
      }
      /* ---------------------- Create Journal Entry - End ---------------------- */
      //

      cdRecord.save();
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>----------------' + strLoggerTitle + '-Exit----------------<|'
    );
  };
  /* --------------------------- After Submit - End --------------------------- */
  //
  /* ----------------------- Edit Journal Record - Begin ---------------------- */
  /**
   *
   * @param {object} context
   * @param {object} cdRecord
   * @param {integer} id
   */
  const editJournalRecord = (context, cdRecord, id) => {
    const strLoggerTitle = ' Edit Journal Record';
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + '-Entry------------------<|'
    );
    //
    try {
      // Get Old Values
      const oldCDRecord = context.oldRecord;
      const jeCreatedOld = oldCDRecord.getValue({
        fieldId: 'custbody_wdym_je_created',
      });
      const expenseAccountOld = oldCDRecord.getValue({
        fieldId: 'custbody_wdym_exp_account',
      });
      const accountOld = oldCDRecord.getValue({ fieldId: 'account' });
      //

      // Get New Values
      const jeCreatedNew = cdRecord.getValue({
        fieldId: 'custbody_wdym_je_created',
      });
      const expenseAccountNew = cdRecord.getValue({
        fieldId: 'custbody_wdym_exp_account',
      });
      const accountNew = cdRecord.getValue({ fieldId: 'account' });
      //

      const expenseAccountChanged = expenseAccountOld !== expenseAccountNew;
      const accountChanged = accountOld !== accountNew;

      const journalentrySearchObj = search.create({
        type: 'journalentry',
        filters: [
          ['type', 'anyof', 'Journal'],
          'AND',
          ['custbody_wdym_je_relateddeposit', 'contains', id],
        ],
        columns: [
          search.createColumn({ name: 'internalid', label: 'Internal ID' }),
        ],
      });
      const searchResultCount = journalentrySearchObj.runPaged().count;

      log.audit(strLoggerTitle, {
        searchCount: searchResultCount,
        expAccChange: expenseAccountChanged,
        accChange: accountChanged,
        jeCreatedNew: jeCreatedNew,
        jeCreatedOld: jeCreatedOld,
      });

      if (searchResultCount && jeCreatedOld !== jeCreatedNew) {
        journalentrySearchObj.run().each(function (result) {
          // .run().each has a limit of 4,000 results

          const journalEntryId = result.getValue('internalid');

          const jeRecord = record.load({
            type: record.Type.JOURNAL_ENTRY,
            id: journalEntryId,
          });

          const jeLineCount = jeRecord.getLineCount({
            sublistId: 'line',
          });
          log.debug(strLoggerTitle, ' Line Count: ' + jeLineCount);

          for (let index = 0; index < jeLineCount; index++) {
            //

            const expenseLineAccount = jeRecord.getSublistValue({
              sublistId: 'line',
              fieldId: 'account',
              line: index,
            });
            log.debug(
              strLoggerTitle,
              ' Expense Line Account: ' + expenseLineAccount
            );
            //

            if (
              expenseAccountChanged &&
              expenseAccountOld === expenseLineAccount
            ) {
              jeRecord.setSublistValue({
                sublistId: 'line',
                fieldId: 'account',
                line: index,
                value: expenseAccountNew,
              });
            } else if (accountChanged && accountOld === expenseLineAccount) {
              jeRecord.setSublistValue({
                sublistId: 'line',
                fieldId: 'account',
                line: index,
                value: accountNew,
              });
            }
          }

          jeRecord.save();
          log.audit(strLoggerTitle, 'JE Record Saved: ' + journalEntryId);

          return true;
        });
      }
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + '-Exit------------------<|'
    );
  };
  /* ------------------------ Edit Journal Record - End ----------------------- */
  //
  /* ---------------------- Create Journal Record - Begin --------------------- */
  /**
   *
   * @param {object} options
   * @returns {integer}
   */
  const createJournalRecord = (options) => {
    const strLoggerTitle = ' Create Journal Record';
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + '-Entry------------------<|'
    );
    //
    let journalEntryId = 0;
    try {
      const journalEntry = record.create({
        type: record.Type.JOURNAL_ENTRY,
        isDynamic: true,
      });

      // const relatedDepositRecord = journalEntry.getField({
      //   fieldId: 'custbody_wdym_je_relateddeposit',
      // });
      // relatedDepositRecord.linkText = customerDepositDocumentNumber;
      // relatedDepositRecord.defaultValue = href;

      journalEntry.setValue({
        fieldId: 'custbody_wdym_je_relateddeposit',
        value: options.href,
      });

      journalEntry.setValue({
        fieldId: 'trandate',
        value: options.date,
      });

      journalEntry.setValue({
        fieldId: 'subsidiary',
        value: '1',
      });

      // Debit Values
      journalEntry.selectNewLine({
        sublistId: 'line',
      });

      const expenseDebitLineAccount = parseInt(options.expenseAccount);
      log.debug(
        strLoggerTitle,
        ' Expense Debit Line Account: ' + expenseDebitLineAccount
      );
      journalEntry.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'account',
        value: expenseDebitLineAccount,
      });

      journalEntry.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'debit',
        value: options.expenseAmount,
      });

      journalEntry.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'memo',
        value: 'Journal Entry created from Customer Deposit',
      });

      journalEntry.commitLine({
        sublistId: 'line',
      });
      //

      // Credit Values
      journalEntry.selectNewLine({
        sublistId: 'line',
      });

      journalEntry.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'account',
        value: options.account,
      });

      journalEntry.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'credit',
        value: options.expenseAmount,
      });

      journalEntry.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'memo',
        value: 'Journal Entry created from Customer Deposit',
      });

      journalEntry.commitLine({
        sublistId: 'line',
      });
      //

      journalEntryId = journalEntry.save();

      log.audit(
        strLoggerTitle + 'Journal Entry created successfully',
        'Journal Entry ID: ' + journalEntryId
      );
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + '-Exit------------------<|'
    );
    return journalEntryId;
  };
  /* ----------------------- Create Journal Record - End ---------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.beforeLoad = beforeLoad;
  exports.beforeSubmit = beforeSubmit;
  exports.afterSubmit = afterSubmit;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
