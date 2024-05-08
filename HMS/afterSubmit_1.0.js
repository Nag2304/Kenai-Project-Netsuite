function SendRENToBSR(type) {
  try {
    var CaseId = nlapiGetRecordId();
    if (defVal(CaseId) != '') {
      nlapiLogExecution('DEBUG', ' CaseId : ', CaseId);
      var builder = nlapiGetFieldValue('company');
      var CaseInfo = nlapiLookupField('supportcase', CaseId, CFields);
      var createApp = CaseInfo.custevent_ren_session;
      var primaryBSR = CaseInfo.custevent_builder_sales_rep_subd;
      var LinkedCaseId = CaseInfo.custevent_linked_cases;
      var status = CaseInfo.status;
      var oldCase = nlapiGetOldRecord();

      if ((type == 'edit' || type == 'xedit') && oldCase != null) {
        var oldStatus = oldCase.getFieldValue('status');
        if (
          oldStatus != status &&
          defVal(LinkedCaseId) != '' &&
          defVal(primaryBSR) != ''
        ) {
          var filters = [];
          filters.push(
            new nlobjSearchFilter(
              'custevent_builder_sales_rep_subd',
              null,
              'is',
              primaryBSR
            )
          );
          filters.push(
            new nlobjSearchFilter(
              'custevent_linked_cases',
              null,
              'is',
              LinkedCaseId
            )
          );

          var Search = nlapiSearchRecord('supportcase', null, filters);
          if (Search != null && Search.length > 0) {
            for (var j = 0; j < Search.length; j++)
              nlapiSubmitField(
                'supportcase',
                Search[j].getId(),
                'status',
                status,
                true
              );
          }
        } else nlapiSubmitField('supportcase', CaseId, 'status', status, true);
      }

      if ((type == 'create' || type == 'edit') && createApp != 'T') {
        //              if(builder=='3643'||builder=='3642')
        {
          var params = [];
          params['custscript_caseid'] = CaseId;
          var sch_status = nlapiScheduleScript(scriptId, deployId, params);
          nlapiLogExecution('DEBUG', 'Script Scheduled', sch_status);

          if (sch_status == 'INPROGRESS' && type == 'create') {
            try {
              var bodyIP =
                'The Appointment tried to schedule the emails when the process was already running.\n Please verify that it was done and the emails were sent correctly.';
              var subjectIP = 'Check New Inquiry Emails: ' + CaseId;
              var recipientIP = [
                'jmcdonald@hmsmarketingservices.com',
                'francisco.alvarado@midware.net',
              ];
              nlapiSendEmail(callCenter, recipientIP, subjectIP, bodyIP);
            } catch (error) {
              nlapiLogExecution('DEBUG', 'INPROGRESS Email', error.message);
            }
          }
        }
      }
    }
  } catch (ex) {
    // try block ends here..
    body = 'SendRENToBSR : ' + ex;
    body += ex.name + ' : ' + ex.message;
    nlapiSendEmail(author, bcc, subject, body);
    nlapiLogExecution('DEBUG', ' Body : ', body);
  }
}
