/*
*--------------------------------------------------------------------
* jQuery-Plugin "textsearch"
* Version: 1.0
* Copyright (c) 2017 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	var vars={
		status:false,
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var functions={
		addquery:function(fieldinfo,value,queries){
			var query='';
			var unequal=value.match(/^!/g);
			var regexdate=new RegExp('^[0-9]{4}(-|\\/)[0-1]?[0-9]{1}(-|\\/)[0-3]?[0-9]{1}$','g');
			var regexdatetime=new RegExp('^[0-9]{4}(-|\\/)[0-1]?[0-9]{1}(-|\\/)[0-3]?[0-9]{1}(T| )[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}\\+09:?00$','g');
			var regextime=new RegExp('^[0-9]{1,2}:[0-9]{1,2}$','g');
			var createquery=function(fieldinfo,unequalsign,condition){
				return fieldinfo.code+((unequal)?unequalsign:'')+condition;
			};
			value=value.replace(/^!/g,'');
			if (fieldinfo.tablecode)
			{
				switch (fieldinfo.type)
				{
					case 'CALC':
						switch (fieldinfo.format)
						{
							case 'DATE':
								if (value.match(regexdate)) query=createquery(fieldinfo,' not',' in ("'+new Date(value).format('Y-m-d')+'")');
								break;
							case 'DATETIME':
								if (value.match(regexdatetime)) query=createquery(fieldinfo,' not',' in ("'+new Date(value).format('Y-m-d H:i:s')+'")');
								break;
							case 'NUMBER':
							case 'NUMBER_DIGIT':
								if ($.isNumeric(value)) query=createquery(fieldinfo,' not',' in ('+value+')');
								break;
							default:
								query=createquery(fieldinfo,' not',' like "%'+value+'%"');
								break;
						}
						break;
					case 'CREATED_TIME':
					case 'DATETIME':
					case 'UPDATED_TIME':
						if (value.match(regexdatetime)) query=createquery(fieldinfo,' not',' in ("'+new Date(value).format('Y-m-d H:i:s')+'")');
						break;
					case 'DATE':
						if (value.match(regexdate)) query=createquery(fieldinfo,' not',' in ("'+new Date(value).format('Y-m-d')+'")');
						break;
					case 'FILE':
					case 'GROUP_SELECT':
					case 'ORGANIZATION_SELECT':
					case 'USER_SELECT':
						break;
					case 'CHECK_BOX':
					case 'DROP_DOWN':
					case 'MULTI_SELECT':
					case 'RADIO_BUTTON':
						if (value in fieldinfo.options) query=createquery(fieldinfo,' not',' in ("'+value+'")');
						break;
					case 'NUMBER':
						if ($.isNumeric(value)) query=createquery(fieldinfo,' not',' in ('+value+')');
						break;
					case 'TIME':
						if (value.match(regextime)) query=createquery(fieldinfo,' not',' in ("'+value+'")');
						break;
					default:
						query=createquery(fieldinfo,' not',' like "%'+value+'%"');
						break;
				}
			}
			else
			{
				switch (fieldinfo.type)
				{
					case 'CALC':
						switch (fieldinfo.format)
						{
							case 'DATE':
								if (value.match(regexdate)) query=createquery(fieldinfo,'!','="'+new Date(value).format('Y-m-d')+'"');
								break;
							case 'DATETIME':
								if (value.match(regexdatetime)) query=createquery(fieldinfo,'!','="'+new Date(value).format('Y-m-d H:i:s')+'"');
								break;
							case 'NUMBER':
							case 'NUMBER_DIGIT':
								if ($.isNumeric(value)) query=createquery(fieldinfo,'!','='+value);
								break;
							default:
								query=createquery(fieldinfo,' not',' like "%'+value+'%"');
								break;
						}
						break;
					case 'CHECK_BOX':
					case 'DROP_DOWN':
					case 'MULTI_SELECT':
					case 'RADIO_BUTTON':
						if (value in fieldinfo.options) query=createquery(fieldinfo,' not',' in ("'+value+'")');
						break;
					case 'CREATED_TIME':
					case 'DATETIME':
					case 'UPDATED_TIME':
						if (value.match(regexdatetime)) query=createquery(fieldinfo,'!','="'+new Date(value).format('Y-m-d H:i:s')+'"');
						break;
					case 'DATE':
						if (value.match(regexdate)) query=createquery(fieldinfo,'!','="'+new Date(value).format('Y-m-d')+'"');
						break;
					case 'LINK':
					case 'MULTI_LINE_TEXT':
					case 'RICH_TEXT':
					case 'SINGLE_LINE_TEXT':
						query=createquery(fieldinfo,' not',' like "%'+value+'%"');
						break;
					case 'NUMBER':
					case 'RECORD_NUMBER':
						if ($.isNumeric(value)) query=createquery(fieldinfo,'!','='+value);
						break;
					case 'STATUS':
						if (vars.status.enable)
							if (value in vars.status.states)
								query=createquery(fieldinfo,' not',' in ("'+value+'")');
						break;
					case 'TIME':
						if (value.match(regextime)) query=createquery(fieldinfo,'!','="'+value+'"');
						break;
				}
			}
			if (query) queries.push(query);
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		if (event.viewType.toUpperCase()=='CUSTOM') return event;
		var queries=$.queries();
		/* get fieldinfo */
		if (!$('#textsearch-container').size())
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				var fieldinfos=$.fieldparallelize(resp.properties);
				kintone.api(kintone.api.url('/k/v1/app/status',true),'GET',{app:kintone.app.getId()},function(resp){
					vars.status=resp;
					kintone.app.getHeaderMenuSpaceElement().appendChild(
						$('<div id="textsearch-container">').addClass('kintoneplugin-input-outer')
						.append(
							$('<input type="text">').addClass('kintoneplugin-input-text').css({
								'padding-right':'48px',
								'position':'relative',
								'z-index':'1'
							})
							.val(('keyword' in queries)?queries['keyword']:'')
						)
						.append(
							$('<img>').css({
								'background-color':'transparent',
								'border':'none',
								'box-sizing':'border-box',
								'cursor':'pointer',
								'display':'block',
								'height':'48px',
								'margin':'0px',
								'position':'absolute',
								'right':'8px',
								'top':'0px',
								'width':'48px',
								'z-index':'2'
							})
							.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA7BJREFUeNpiYKAa6J8yMQFK/yfbhP9Qej7RigkpOk+U1QABRLnf92MTZ4LSDkgKHbDpNiDoHZACvIqIChCAAKIIMeLwNtxHhTn5jCTFNHoo4FLPRISZ58mJNQdCwctIauIlKRzwAYAAGqKIkUBcNwIDp4GsRAIqFoC4gBiNAaTmEOQUZkBpWfCeXJtB4AFSMRgAYoNSE9Zyg5R0TVbaRteEnK4JZkn0TAA0rIGcwPxP+4KNWAAQQKO5mVCeg2WdA8DYP0Azi6FZTACILwAtMkQSB4ndxyZHjfbNf2LaE1RNsqBMQ4phUMsdSLEDV04+gBSkRJW3pMY5E45iA2RIIxC/x9cQhEbFeiB2pHqqhlYz/TikHUGOhLZXzpNS6TNSIT2A4nY/MQUuVS0mpibD5gCqt4NwOCARaPkCuhSJ0CyZMFo5wABAAI2iUTCwLRBoLVWAVBI10NRioIUK0JYG0UUhxRaj1TiBQEs2oLWu66FcQaDcB1ItZiHUu8bmK2hQw1op78kp85lw+HY9kUGpiFRnU24xEICaMwSDD+iwBzC3UstiEJhIpBlkta+ZqJAlBahtcT2RZhhQ0+IFxDRvkdrSgVSxGJhoEqHM9wRKs/1Q9RuoGdSCSL2E+WiW7oc5Cpbl8A3Jkduufo8jAT0AWqqIRQ1RDTtSuqmw+PwANPgCWm/CgNRWJTUa9Lja03gtp0Y+xpWi5+Nr3lJsMTRFJ5JqOTV8zAANUpyW08xiIiynncV4LBekW0MO1GQiawxwFAwrABCgXau9QRCIoYQJWMENdAJlBCZQJjCOwAZugE4AG+AGygSs4AjapJra8HF3HEcx96J/jCR91uu1r8+/PDw8/k+FUGw+jzhg9gGGT+iSMjJkLoMwzgxVS5v/xKG1Jp9tA+IfIIDOPDYRMZwRRgnozogq77dxysvZvwE2Z7E4wi17h2yMyMacI5Dl1dTZDjWCixjZZKyiiFm9EAmlmjrDOvMDlc5KE9FhQOwArHU3k1MSpqgtx3FzVbRMCW8tDnURq+AyzjCe108wO4uTZ8GOykNSlYYrqWEBJiMy25Dr7SvRiWs8WuQ7OIOpSveERalg9/j5/exJeqcVYeC7gUIUBd3i+Q9R7N5y8v0n/pDl7IRbyB/e733QvxmAwK+cQE+bSmHFVjC7F5RbVRQwirgI82vPrsE6cTFuXxTPc4NHtYiLszcbEofitlG5JUJphCFbuKdLNR77FM3lZdgw48om0MU49juIO1dMPDw8PJziBXvFttyY+HdhAAAAAElFTkSuQmCC')
							.on('click',function(){
								var target=$('input',$('#textsearch-container'));
								if (target.val())
								{
									var queries=[];
									var values=target.val().replace(/[　 ]+/g,' ').split(' ');
									for (var i=0;i<values.length;i++)
									{
										var query=[];
										var value=values[i];
										if (value)
										{
											if (value.match(/->/g))
											{
												var keyvalue=value.split('->');
												if (keyvalue[1])
													$.each(fieldinfos,function(key,values){
														if (values.label==keyvalue[0]) functions.addquery(values,keyvalue[1],query);
													});
											}
											else
											{
												$.each(fieldinfos,function(key,values){
													functions.addquery(values,value,query);
												});
											}
											if (query.length!=0) queries.push('('+query.join(' or ')+')');
										}
									}
									if (queries.length!=0) window.location.href=kintone.api.url('/k/', true).replace(/\.json/g,'')+kintone.app.getId()+'/?view='+event.viewId+'&keyword='+target.val()+'&query='+encodeURIComponent(queries.join(' and '));
								}
								else window.location.href=kintone.api.url('/k/', true).replace(/\.json/g,'')+kintone.app.getId()+'/?view='+event.viewId;
							})
						)[0]
					);
				},function(error){});
			},function(error){});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
