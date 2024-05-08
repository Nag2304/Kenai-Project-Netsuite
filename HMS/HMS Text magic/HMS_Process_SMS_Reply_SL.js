function trim(str)
{
	return str.replace(/^\s+|\s+$/g,"");
}

function currentdate()
{
	var cdate = new Date();
    cdate.setHours(cdate.getHours() + 3);
    var dateStr = nlapiDateToString(cdate, "datetime")
    return dateStr;
}
 
var todaydate = currentdate();

function processURL(request,response)
{
	var reqid = request.getParameter('reqid');
	var messages = request.getParameter('messages');
	var text = request.getParameter('text');
	var message_id = request.getParameter('message_id');
	var timestamp = request.getParameter('timestamp');
	var status = request.getParameter('status');
	var credit_cost = request.getParameter('credit_cost');

	nlapiLogExecution('DEBUG','reqid ',' reqid '+reqid);
	nlapiLogExecution('DEBUG','messages ',' messages '+ messages);
	nlapiLogExecution('DEBUG','messages ',' text '+ text);
	nlapiLogExecution('DEBUG','message_id ',' message_id '+message_id);
	nlapiLogExecution('DEBUG','timestamp ',' timestamp '+timestamp);
	nlapiLogExecution('DEBUG','status ',' status '+status);
	nlapiLogExecution('DEBUG','credit_cost ',' credit_cost '+credit_cost);
	nlapiLogExecution('DEBUG','request ',request);

	if(reqid == 1)//for delievery address
	{
		var messages = request.getParameter('messages');
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var status = request.getParameter('status');
		var credit_cost = request.getParameter('credit_cost');
		var recordiid = searchCase('hmsmarketingservices');
		nlapiLogExecution('DEBUG','delivery notifications '+messages,' message_id '+message_id+' timestamp '+timestamp+' status '+status+' credit_cost '+credit_cost+' recordiid '+recordiid);
		
		
	}
	else if(reqid == 2)//for account main
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var from = request.getParameter('from');
		var text = request.getParameter('text');
		var messages = request.getParameter('messages');
		var recordiid = searchCase('hmsmarketingservices');
		nlapiLogExecution('DEBUG','Reply '+messages,' message_id '+message_id+' timestamp '+timestamp+' from '+from+' text '+text+' recordiid '+recordiid);
		if(recordiid && (recordiid != 'null'))
		{
			var oldreply = nlapiLookupField('supportcase',recordiid,'custevent_hms_sms_reply_msg') || '';
			var newreply = oldreply+'\n'+todaydate+' -- '+text;
			var fieldtypes = [];
			var fieldvalues = [];
			fieldtypes.push('custevent_hms_sms_reply_msg');
			
			fieldvalues.push(newreply);
			if(text)
			{
				var yes1 = text.search(/yes/i);
				var y1 = text.search(/y/i);
				if((yes1 >=0) || (y1 >= 0))
				{
					fieldtypes.push('status');
					fieldvalues.push(5);
				}
			}
			//nlapiSubmitField('supportcase',recordiid,'custevent_hms_sms_reply_msg',text);
			nlapiSubmitField('supportcase',recordiid,fieldtypes,fieldvalues);
		}
		updateLogin('hmsmarketingservices');
		
	}
	else if(reqid == 3)//for delievery of sub account 1
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var status = request.getParameter('status');
		var credit_cost = request.getParameter('credit_cost');
		var recordiid = searchCase('text.one');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' status '+status+' credit_cost '+credit_cost+' recordiid '+recordiid);
		
		
	}
	else if(reqid == 4)//for sub account 1 response
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var from = request.getParameter('from');
		var text = request.getParameter('text');
		var recordiid = searchCase('text.one');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' from '+from+' text '+text+' recordiid '+recordiid);
		if(recordiid && (recordiid != 'null'))
		{
			var oldreply = nlapiLookupField('supportcase',recordiid,'custevent_hms_sms_reply_msg') || '';
			var newreply = oldreply+'\n'+todaydate+' -- '+text;
			//nlapiSubmitField('supportcase',recordiid,'custevent_hms_sms_reply_msg',text);
			var fieldtypes = [];
			var fieldvalues = [];
			fieldtypes.push('custevent_hms_sms_reply_msg');
			fieldvalues.push(newreply);
			if(text)
			{
				var yes1 = text.search(/yes/i);
				var y1 = text.search(/y/i);
				if((yes1 >=0) || (y1 >= 0))
				{
					fieldtypes.push('status');
					fieldvalues.push(5);
				}
			}
			
			nlapiSubmitField('supportcase',recordiid,fieldtypes,fieldvalues);
		}
		updateLogin('text.one');
		
	}
	else if(reqid == 5)//for delievery of sub account 2
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var status = request.getParameter('status');
		var credit_cost = request.getParameter('credit_cost');
		var recordiid = searchCase('text.two');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' status '+status+' credit_cost '+credit_cost+' recordiid '+recordiid);
		
		
	}
	else if(reqid == 6)//for sub account 2 response
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var from = request.getParameter('from');
		var text = request.getParameter('text');
		var recordiid = searchCase('text.two');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' from '+from+' text '+text+' recordiid '+recordiid);
		if(recordiid && (recordiid != 'null'))
		{
			var oldreply = nlapiLookupField('supportcase',recordiid,'custevent_hms_sms_reply_msg') || '';
			var newreply = oldreply+'\n'+todaydate+' -- '+text;
			
			//nlapiSubmitField('supportcase',recordiid,'custevent_hms_sms_reply_msg',text);
			var fieldtypes = [];
			var fieldvalues = [];
			fieldtypes.push('custevent_hms_sms_reply_msg');
			fieldvalues.push(newreply);
			if(text)
			{
				var yes1 = text.search(/yes/i);
				var y1 = text.search(/y/i);
				if((yes1 >=0) || (y1 >= 0))
				{
					fieldtypes.push('status');
					fieldvalues.push(5);
				}
			}
			
			nlapiSubmitField('supportcase',recordiid,fieldtypes,fieldvalues);
		}
		updateLogin('text.two');
		
	}
	else if(reqid == 7)//for delievery of sub account 3
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var status = request.getParameter('status');
		var credit_cost = request.getParameter('credit_cost');
		var recordiid = searchCase('text.three');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' status '+status+' credit_cost '+credit_cost+' recordiid '+recordiid);
		
		
	}
	else if(reqid == 8)//for sub account 3 response
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var from = request.getParameter('from');
		var text = request.getParameter('text');
		var recordiid = searchCase('text.three');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' from '+from+' text '+text+' recordiid '+recordiid);
		if(recordiid && (recordiid != 'null'))
		{
			var oldreply = nlapiLookupField('supportcase',recordiid,'custevent_hms_sms_reply_msg') || '';
			var newreply = oldreply+'\n'+todaydate+' -- '+text;
			
			//nlapiSubmitField('supportcase',recordiid,'custevent_hms_sms_reply_msg',text);
			var fieldtypes = [];
			var fieldvalues = [];
			fieldtypes.push('custevent_hms_sms_reply_msg');
			fieldvalues.push(newreply);
			if(text)
			{
				var yes1 = text.search(/yes/i);
				var y1 = text.search(/y/i);
				if((yes1 >=0) || (y1 >= 0))
				{
					fieldtypes.push('status');
					fieldvalues.push(5);
				}
			}
			
			nlapiSubmitField('supportcase',recordiid,fieldtypes,fieldvalues);
		}
		updateLogin('text.three');
		
	}
	else if(reqid == 9)//for delievery of sub account 4
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var status = request.getParameter('status');
		var credit_cost = request.getParameter('credit_cost');
		var recordiid = searchCase('text.four');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' status '+status+' credit_cost '+credit_cost+' recordiid '+recordiid);
		
		
	}
	else if(reqid == 10)//for sub account 4 response
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var from = request.getParameter('from');
		var text = request.getParameter('text');
		var recordiid = searchCase('text.four');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' from '+from+' text '+text+' recordiid '+recordiid);
		if(recordiid && (recordiid != 'null'))
		{
			var oldreply = nlapiLookupField('supportcase',recordiid,'custevent_hms_sms_reply_msg') || '';
			var newreply = oldreply+'\n'+todaydate+' -- '+text;
			
			//nlapiSubmitField('supportcase',recordiid,'custevent_hms_sms_reply_msg',text);
			var fieldtypes = [];
			var fieldvalues = [];
			fieldtypes.push('custevent_hms_sms_reply_msg');
			fieldvalues.push(newreply);
			if(text)
			{
				var yes1 = text.search(/yes/i);
				var y1 = text.search(/y/i);
				if((yes1 >=0) || (y1 >= 0))
				{
					fieldtypes.push('status');
					fieldvalues.push(5);
				}
			}
			
			nlapiSubmitField('supportcase',recordiid,fieldtypes,fieldvalues);
		}
		updateLogin('text.four');
		
	}
	else if(reqid == 11)//for delievery of sub account 5
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var status = request.getParameter('status');
		var credit_cost = request.getParameter('credit_cost');
		var recordiid = searchCase('text.five');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' status '+status+' credit_cost '+credit_cost+' recordiid '+recordiid);
		
		
	}
	else if(reqid == 12)//for sub account 5 response
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var from = request.getParameter('from');
		var text = request.getParameter('text');
		var recordiid = searchCase('text.five');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' from '+from+' text '+text+' recordiid '+recordiid);
		if(recordiid && (recordiid != 'null'))
		{
			var oldreply = nlapiLookupField('supportcase',recordiid,'custevent_hms_sms_reply_msg') || '';
			var newreply = oldreply+'\n'+todaydate+' -- '+text;
			
			//nlapiSubmitField('supportcase',recordiid,'custevent_hms_sms_reply_msg',text);
			var fieldtypes = [];
			var fieldvalues = [];
			fieldtypes.push('custevent_hms_sms_reply_msg');
			fieldvalues.push(newreply);
			if(text)
			{
				var yes1 = text.search(/yes/i);
				var y1 = text.search(/y/i);
				if((yes1 >=0) || (y1 >= 0))
				{
					fieldtypes.push('status');
					fieldvalues.push(5);
				}
			}
			
			nlapiSubmitField('supportcase',recordiid,fieldtypes,fieldvalues);
		}
		updateLogin('text.five');
		
	}
	else if(reqid == 13)//for delievery of sub account 6
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var status = request.getParameter('status');
		var credit_cost = request.getParameter('credit_cost');
		var recordiid = searchCase('text.six');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' status '+status+' credit_cost '+credit_cost+' recordiid '+recordiid);
		
		
	}
	else if(reqid == 14)//for sub account 6 response
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var from = request.getParameter('from');
		var text = request.getParameter('text');
		var recordiid = searchCase('text.six');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' from '+from+' text '+text+' recordiid '+recordiid);
		if(recordiid && (recordiid != 'null'))
		{
			var oldreply = nlapiLookupField('supportcase',recordiid,'custevent_hms_sms_reply_msg') || '';
			var newreply = oldreply+'\n'+todaydate+' -- '+text;
			
			//nlapiSubmitField('supportcase',recordiid,'custevent_hms_sms_reply_msg',text);
			var fieldtypes = [];
			var fieldvalues = [];
			fieldtypes.push('custevent_hms_sms_reply_msg');
			fieldvalues.push(newreply);
			if(text)
			{
				var yes1 = text.search(/yes/i);
				var y1 = text.search(/y/i);
				if((yes1 >=0) || (y1 >= 0))
				{
					fieldtypes.push('status');
					fieldvalues.push(5);
				}
			}
			
			nlapiSubmitField('supportcase',recordiid,fieldtypes,fieldvalues);
		}
		updateLogin('text.six');
		
	}
	else if(reqid == 15)//for delievery of sub account 7
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var status = request.getParameter('status');
		var credit_cost = request.getParameter('credit_cost');
		var recordiid = searchCase('text.seven');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' status '+status+' credit_cost '+credit_cost+' recordiid '+recordiid);
		
		
	}
	else if(reqid == 16)//for sub account 7 response
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var from = request.getParameter('from');
		var text = request.getParameter('text');
		var recordiid = searchCase('text.seven');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' from '+from+' text '+text+' recordiid '+recordiid);
		if(recordiid && (recordiid != 'null'))
		{
			var oldreply = nlapiLookupField('supportcase',recordiid,'custevent_hms_sms_reply_msg') || '';
			var newreply = oldreply+'\n'+todaydate+' -- '+text;
			
		//	nlapiSubmitField('supportcase',recordiid,'custevent_hms_sms_reply_msg',text);
			var fieldtypes = [];
			var fieldvalues = [];
			fieldtypes.push('custevent_hms_sms_reply_msg');
			fieldvalues.push(newreply);
			if(text)
			{
				var yes1 = text.search(/yes/i);
				var y1 = text.search(/y/i);
				if((yes1 >=0) || (y1 >= 0))
				{
					fieldtypes.push('status');
					fieldvalues.push(5);
				}
			}
			
			nlapiSubmitField('supportcase',recordiid,fieldtypes,fieldvalues);
		}
		updateLogin('text.seven');
		
	}
	else if(reqid == 17)//for delievery of sub account 8
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var status = request.getParameter('status');
		var credit_cost = request.getParameter('credit_cost');
		var recordiid = searchCase('text.eight');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' status '+status+' credit_cost '+credit_cost+' recordiid '+recordiid);
		
		
	}
	else if(reqid == 18)//for sub account 8 response
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var from = request.getParameter('from');
		var text = request.getParameter('text');
		var recordiid = searchCase('text.eight');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' from '+from+' text '+text+' recordiid '+recordiid);
		if(recordiid && (recordiid != 'null'))
		{
			var oldreply = nlapiLookupField('supportcase',recordiid,'custevent_hms_sms_reply_msg') || '';
			var newreply = oldreply+'\n'+todaydate+' -- '+text;
			
			//nlapiSubmitField('supportcase',recordiid,'custevent_hms_sms_reply_msg',text);
			var fieldtypes = [];
			var fieldvalues = [];
			fieldtypes.push('custevent_hms_sms_reply_msg');
			fieldvalues.push(newreply);
			if(text)
			{
				var yes1 = text.search(/yes/i);
				var y1 = text.search(/y/i);
				if((yes1 >=0) || (y1 >= 0))
				{
					fieldtypes.push('status');
					fieldvalues.push(5);
				}
			}
			
			nlapiSubmitField('supportcase',recordiid,fieldtypes,fieldvalues);
		}
		updateLogin('text.eight');
		
	}
	else if(reqid == 19)//for delievery of sub account 9
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var status = request.getParameter('status');
		var credit_cost = request.getParameter('credit_cost');
		var recordiid = searchCase('text.nine');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' status '+status+' credit_cost '+credit_cost+' recordiid '+recordiid);
		
		
	}
	else if(reqid == 20)//for sub account 9 response
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var from = request.getParameter('from');
		var text = request.getParameter('text');
		var recordiid = searchCase('text.nine');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' from '+from+' text '+text+' recordiid '+recordiid);
		if(recordiid && (recordiid != 'null'))
		{
			var oldreply = nlapiLookupField('supportcase',recordiid,'custevent_hms_sms_reply_msg') || '';
			var newreply = oldreply+'\n'+todaydate+' -- '+text;
			
			//nlapiSubmitField('supportcase',recordiid,'custevent_hms_sms_reply_msg',text);
			var fieldtypes = [];
			var fieldvalues = [];
			fieldtypes.push('custevent_hms_sms_reply_msg');
			fieldvalues.push(newreply);
			if(text)
			{
				var yes1 = text.search(/yes/i);
				var y1 = text.search(/y/i);
				if((yes1 >=0) || (y1 >= 0))
				{
					fieldtypes.push('status');
					fieldvalues.push(5);
				}
			}
			
			nlapiSubmitField('supportcase',recordiid,fieldtypes,fieldvalues);
		}
		updateLogin('text.nine');
		
	}
	else if(reqid == 21)//for delievery of sub account 10
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var status = request.getParameter('status');
		var credit_cost = request.getParameter('credit_cost');
		var recordiid = searchCase('textten');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' status '+status+' credit_cost '+credit_cost+' recordiid '+recordiid);
	}
	else if(reqid == 22)//for sub account 10 response
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var from = request.getParameter('from');
		var text = request.getParameter('text');
		var recordiid = searchCase('textten');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' from '+from+' text '+text+' recordiid '+recordiid);
		if(recordiid && (recordiid != 'null'))
		{
			var oldreply = nlapiLookupField('supportcase',recordiid,'custevent_hms_sms_reply_msg') || '';
			var newreply = oldreply+'\n'+todaydate+' -- '+text;
			
			//nlapiSubmitField('supportcase',recordiid,'custevent_hms_sms_reply_msg',text);
			var fieldtypes = [];
			var fieldvalues = [];
			fieldtypes.push('custevent_hms_sms_reply_msg');
			fieldvalues.push(newreply);
			if(text)
			{
				var yes1 = text.search(/yes/i);
				var y1 = text.search(/y/i);
				if((yes1 >=0) || (y1 >= 0))
				{
					fieldtypes.push('status');
					fieldvalues.push(5);
				}
			}
			
			nlapiSubmitField('supportcase',recordiid,fieldtypes,fieldvalues);
		}
		updateLogin('textten');
		
	}
	else if(reqid == 23)//for delievery of sub account 11
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var status = request.getParameter('status');
		var credit_cost = request.getParameter('credit_cost');
		var recordiid = searchCase('texteleven');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' status '+status+' credit_cost '+credit_cost+' recordiid '+recordiid);
	}
	else if(reqid == 24)//for sub account 11 response
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var from = request.getParameter('from');
		var text = request.getParameter('text');
		var recordiid = searchCase('texteleven');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' from '+from+' text '+text+' recordiid '+recordiid);
		if(recordiid && (recordiid != 'null'))
		{
			var oldreply = nlapiLookupField('supportcase',recordiid,'custevent_hms_sms_reply_msg') || '';
			var newreply = oldreply+'\n'+todaydate+' -- '+text;
			
			//nlapiSubmitField('supportcase',recordiid,'custevent_hms_sms_reply_msg',text);
			var fieldtypes = [];
			var fieldvalues = [];
			fieldtypes.push('custevent_hms_sms_reply_msg');
			fieldvalues.push(newreply);
			if(text)
			{
				var yes1 = text.search(/yes/i);
				var y1 = text.search(/y/i);
				if((yes1 >=0) || (y1 >= 0))
				{
					fieldtypes.push('status');
					fieldvalues.push(5);
				}
			}
			
			nlapiSubmitField('supportcase',recordiid,fieldtypes,fieldvalues);
		}
		updateLogin('texteleven');
		
	}
	else if(reqid == 25)//for delievery of sub account 12
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var status = request.getParameter('status');
		var credit_cost = request.getParameter('credit_cost');
		var recordiid = searchCase('texttwelve');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' status '+status+' credit_cost '+credit_cost+' recordiid '+recordiid);
	}
	else if(reqid == 26)//for sub account 12 response
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var from = request.getParameter('from');
		var text = request.getParameter('text');
		var recordiid = searchCase('texttwelve');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' from '+from+' text '+text+' recordiid '+recordiid);
		if(recordiid && (recordiid != 'null'))
		{
			var oldreply = nlapiLookupField('supportcase',recordiid,'custevent_hms_sms_reply_msg') || '';
			var newreply = oldreply+'\n'+todaydate+' -- '+text;
			
			//nlapiSubmitField('supportcase',recordiid,'custevent_hms_sms_reply_msg',text);
			var fieldtypes = [];
			var fieldvalues = [];
			fieldtypes.push('custevent_hms_sms_reply_msg');
			fieldvalues.push(newreply);
			if(text)
			{
				var yes1 = text.search(/yes/i);
				var y1 = text.search(/y/i);
				if((yes1 >=0) || (y1 >= 0))
				{
					fieldtypes.push('status');
					fieldvalues.push(5);
				}
			}
			
			nlapiSubmitField('supportcase',recordiid,fieldtypes,fieldvalues);
		}
		updateLogin('texttwelve');
		
	}
	else if(reqid == 27)//for delievery of sub account 13
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var status = request.getParameter('status');
		var credit_cost = request.getParameter('credit_cost');
		var recordiid = searchCase('textthirteen');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' status '+status+' credit_cost '+credit_cost+' recordiid '+recordiid);
	}
	else if(reqid == 28)//for sub account 13 response
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var from = request.getParameter('from');
		var text = request.getParameter('text');
		var recordiid = searchCase('textthirteen');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' from '+from+' text '+text+' recordiid '+recordiid);
		if(recordiid && (recordiid != 'null'))
		{
			var oldreply = nlapiLookupField('supportcase',recordiid,'custevent_hms_sms_reply_msg') || '';
			var newreply = oldreply+'\n'+todaydate+' -- '+text;
			
			//nlapiSubmitField('supportcase',recordiid,'custevent_hms_sms_reply_msg',text);
			var fieldtypes = [];
			var fieldvalues = [];
			fieldtypes.push('custevent_hms_sms_reply_msg');
			fieldvalues.push(newreply);
			if(text)
			{
				var yes1 = text.search(/yes/i);
				var y1 = text.search(/y/i);
				if((yes1 >=0) || (y1 >= 0))
				{
					fieldtypes.push('status');
					fieldvalues.push(5);
				}
			}
			
			nlapiSubmitField('supportcase',recordiid,fieldtypes,fieldvalues);
		}
		updateLogin('textthirteen');
		
	}
	else if(reqid == 29)//for delievery of sub account 14
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var status = request.getParameter('status');
		var credit_cost = request.getParameter('credit_cost');
		var recordiid = searchCase('textfourteen');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' status '+status+' credit_cost '+credit_cost+' recordiid '+recordiid);
	}
	else if(reqid == 30)//for sub account 14 response
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var from = request.getParameter('from');
		var text = request.getParameter('text');
		var recordiid = searchCase('textfourteen');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' from '+from+' text '+text+' recordiid '+recordiid);
		if(recordiid && (recordiid != 'null'))
		{
			var oldreply = nlapiLookupField('supportcase',recordiid,'custevent_hms_sms_reply_msg') || '';
			var newreply = oldreply+'\n'+todaydate+' -- '+text;
			
			//nlapiSubmitField('supportcase',recordiid,'custevent_hms_sms_reply_msg',text);
			var fieldtypes = [];
			var fieldvalues = [];
			fieldtypes.push('custevent_hms_sms_reply_msg');
			fieldvalues.push(newreply);
			if(text)
			{
				var yes1 = text.search(/yes/i);
				var y1 = text.search(/y/i);
				if((yes1 >=0) || (y1 >= 0))
				{
					fieldtypes.push('status');
					fieldvalues.push(5);
				}
			}
			
			nlapiSubmitField('supportcase',recordiid,fieldtypes,fieldvalues);
		}
		updateLogin('textfourteen');
		
	}
	else if(reqid == 31)//for delievery of sub account 15
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var status = request.getParameter('status');
		var credit_cost = request.getParameter('credit_cost');
		var recordiid = searchCase('textfifteen');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' status '+status+' credit_cost '+credit_cost+' recordiid '+recordiid);
	}
	else if(reqid == 32)//for sub account 15 response
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var from = request.getParameter('from');
		var text = request.getParameter('text');
		var recordiid = searchCase('textfifteen');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' from '+from+' text '+text+' recordiid '+recordiid);
		if(recordiid && (recordiid != 'null'))
		{
			var oldreply = nlapiLookupField('supportcase',recordiid,'custevent_hms_sms_reply_msg') || '';
			var newreply = oldreply+'\n'+todaydate+' -- '+text;
			
			//nlapiSubmitField('supportcase',recordiid,'custevent_hms_sms_reply_msg',text);
			var fieldtypes = [];
			var fieldvalues = [];
			fieldtypes.push('custevent_hms_sms_reply_msg');
			fieldvalues.push(newreply);
			if(text)
			{
				var yes1 = text.search(/yes/i);
				var y1 = text.search(/y/i);
				if((yes1 >=0) || (y1 >= 0))
				{
					fieldtypes.push('status');
					fieldvalues.push(5);
				}
			}
			
			nlapiSubmitField('supportcase',recordiid,fieldtypes,fieldvalues);
		}
		updateLogin('textfifteen');
		
	}
	else if(reqid == 33)//for delievery of sub account 16
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var status = request.getParameter('status');
		var credit_cost = request.getParameter('credit_cost');
		var recordiid = searchCase('textsixteen');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' status '+status+' credit_cost '+credit_cost+' recordiid '+recordiid);
	}
	else if(reqid == 34)//for sub account 16 response
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var from = request.getParameter('from');
		var text = request.getParameter('text');
		var recordiid = searchCase('textsixteen');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' from '+from+' text '+text+' recordiid '+recordiid);
		if(recordiid && (recordiid != 'null'))
		{
			var oldreply = nlapiLookupField('supportcase',recordiid,'custevent_hms_sms_reply_msg') || '';
			var newreply = oldreply+'\n'+todaydate+' -- '+text;
			
			//nlapiSubmitField('supportcase',recordiid,'custevent_hms_sms_reply_msg',text);
			var fieldtypes = [];
			var fieldvalues = [];
			fieldtypes.push('custevent_hms_sms_reply_msg');
			fieldvalues.push(newreply);
			if(text)
			{
				var yes1 = text.search(/yes/i);
				var y1 = text.search(/y/i);
				if((yes1 >=0) || (y1 >= 0))
				{
					fieldtypes.push('status');
					fieldvalues.push(5);
				}
			}
			
			nlapiSubmitField('supportcase',recordiid,fieldtypes,fieldvalues);
		}
		updateLogin('textsixteen');
		
	}
	else if(reqid == 35)//for delievery of sub account 17
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var status = request.getParameter('status');
		var credit_cost = request.getParameter('credit_cost');
		var recordiid = searchCase('textseventeen');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' status '+status+' credit_cost '+credit_cost+' recordiid '+recordiid);
	}
	else if(reqid == 36)//for sub account 17 response
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var from = request.getParameter('from');
		var text = request.getParameter('text');
		var recordiid = searchCase('textseventeen');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' from '+from+' text '+text+' recordiid '+recordiid);
		if(recordiid && (recordiid != 'null'))
		{
			var oldreply = nlapiLookupField('supportcase',recordiid,'custevent_hms_sms_reply_msg') || '';
			var newreply = oldreply+'\n'+todaydate+' -- '+text;
			
			//nlapiSubmitField('supportcase',recordiid,'custevent_hms_sms_reply_msg',text);
			var fieldtypes = [];
			var fieldvalues = [];
			fieldtypes.push('custevent_hms_sms_reply_msg');
			fieldvalues.push(newreply);
			if(text)
			{
				var yes1 = text.search(/yes/i);
				var y1 = text.search(/y/i);
				if((yes1 >=0) || (y1 >= 0))
				{
					fieldtypes.push('status');
					fieldvalues.push(5);
				}
			}
			
			nlapiSubmitField('supportcase',recordiid,fieldtypes,fieldvalues);
		}
		updateLogin('textseventeen');
		
	}
	else if(reqid == 37)//for delievery of sub account 18
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var status = request.getParameter('status');
		var credit_cost = request.getParameter('credit_cost');
		var recordiid = searchCase('texteighteen');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' status '+status+' credit_cost '+credit_cost+' recordiid '+recordiid);
	}
	else if(reqid == 38)//for sub account 18 response
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var from = request.getParameter('from');
		var text = request.getParameter('text');
		var recordiid = searchCase('texteighteen');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' from '+from+' text '+text+' recordiid '+recordiid);
		if(recordiid && (recordiid != 'null'))
		{
			var oldreply = nlapiLookupField('supportcase',recordiid,'custevent_hms_sms_reply_msg') || '';
			var newreply = oldreply+'\n'+todaydate+' -- '+text;
			
			//nlapiSubmitField('supportcase',recordiid,'custevent_hms_sms_reply_msg',text);
			var fieldtypes = [];
			var fieldvalues = [];
			fieldtypes.push('custevent_hms_sms_reply_msg');
			fieldvalues.push(newreply);
			if(text)
			{
				var yes1 = text.search(/yes/i);
				var y1 = text.search(/y/i);
				if((yes1 >=0) || (y1 >= 0))
				{
					fieldtypes.push('status');
					fieldvalues.push(5);
				}
			}
			
			nlapiSubmitField('supportcase',recordiid,fieldtypes,fieldvalues);
		}
		updateLogin('texteighteen');
		
	}
	else if(reqid == 39)//for delievery of sub account 19
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var status = request.getParameter('status');
		var credit_cost = request.getParameter('credit_cost');
		var recordiid = searchCase('textnineteen');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' status '+status+' credit_cost '+credit_cost+' recordiid '+recordiid);
	}
	else if(reqid == 40)//for sub account 19 response
	{
		var message_id = request.getParameter('message_id');
		var timestamp = request.getParameter('timestamp');
		var from = request.getParameter('from');
		var text = request.getParameter('text');
		var recordiid = searchCase('textnineteen');
		nlapiLogExecution('DEBUG','delivery notifications ',' message_id '+message_id+' timestamp '+timestamp+' from '+from+' text '+text+' recordiid '+recordiid);
		if(recordiid && (recordiid != 'null'))
		{
			var oldreply = nlapiLookupField('supportcase',recordiid,'custevent_hms_sms_reply_msg') || '';
			var newreply = oldreply+'\n'+todaydate+' -- '+text;
			
			//nlapiSubmitField('supportcase',recordiid,'custevent_hms_sms_reply_msg',text);
			var fieldtypes = [];
			var fieldvalues = [];
			fieldtypes.push('custevent_hms_sms_reply_msg');
			fieldvalues.push(newreply);
			if(text)
			{
				var yes1 = text.search(/yes/i);
				var y1 = text.search(/y/i);
				if((yes1 >=0) || (y1 >= 0))
				{
					fieldtypes.push('status');
					fieldvalues.push(5);
				}
			}
			
			nlapiSubmitField('supportcase',recordiid,fieldtypes,fieldvalues);
		}
		updateLogin('textnineteen');
		
	}
	
	
	
}



function updateLogin(usernamei)
{
	var filters = [];
	filters.push( new nlobjSearchFilter( 'isinactive', null, 'is', 'F', null));
	filters.push( new nlobjSearchFilter( 'custrecord_hms_magic_text_username', null, 'is', usernamei, null));
	
	
	var columns = [];
	columns.push(new nlobjSearchColumn('internalid'));	
	columns.push(new nlobjSearchColumn('custrecord_hms_magic_text_username'));	
	columns.push(new nlobjSearchColumn('custrecord_hms_magic_text_password'));	
	columns[0].setSort(false);
	var searchresults = nlapiSearchRecord('customrecord_hms_magic_text_logins', null, filters, columns);
	var assignedvalue = '';
	
	if(searchresults)
	{
		var searchlength = searchresults.length;
		//for(var i=0;i < searchlength;i++)
		{
			var searchid = searchresults[0].getId();
			var searchtype = searchresults[0].getRecordType();
			//username = searchresults[0].getValue('custrecord_hms_magic_text_username');
			//password = searchresults[0].getValue('custrecord_hms_magic_text_password');
			var loginrecord = nlapiLoadRecord(searchtype, searchid);
			loginrecord.setFieldValue('custrecord_hms_is_blocked','F');
            loginrecord.setFieldValue('custrecord_hms_support_ref','');
			var sid = nlapiSubmitRecord(loginrecord,true,true);
			nlapiLogExecution( 'DEBUG',   ' sid ', ' sid '+sid);
			
			
		}
	}

}




function searchCase(messageid)
{
	//custevent_hms_sms_message_id
	try
    {
		var filters = new Array();
	   
		filters.push( new nlobjSearchFilter( 'isinactive', null, 'is', 'F', null));
		filters.push(new nlobjSearchFilter('custevent_hms_sms_message_id',null,'is',messageid));
		
		var columns = [];
		columns.push(new nlobjSearchColumn('internalid'));	
		columns[0].setSort(true);
		finalresults = nlapiSearchRecord('supportcase', null,filters, columns);
		if(finalresults)
		{
			var recordid = finalresults[0].getId();
			return recordid;
		}
		else
		{
			return '';
		}
           
    }
    catch(e)
    {
        var errmsg = ''
        var err = '';
        if ( e instanceof nlobjError )
        {
            err = 'System error: ' + e.getCode() + '\n' + e.getDetails();
        }
        else
        {
            err = 'Unexpected error: ' + e.toString();
        }
        errmsg += '\n' + err;
        nlapiLogExecution( 'ERROR','ERROR'+ ' 999 Error', errmsg);
        return '';
    }
}