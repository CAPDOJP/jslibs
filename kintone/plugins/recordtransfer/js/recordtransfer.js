/*
*--------------------------------------------------------------------
* jQuery-Plugin "recordtransfer"
* Version: 1.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	/*---------------------------------------------------------------
	 valiable
	---------------------------------------------------------------*/
	var vars={
		apps:[],
		config:{},
		fieldinfos:{}
	};
	var events={
		show:[
			'app.record.detail.show'
		]
	};
	var functions={
		/* download */
		download:function(fileKey)
		{
			return new Promise(function(resolve,reject)
			{
				var url=kintone.api.url('/k/v1/file',true)+'?fileKey='+fileKey;
				var xhr=new XMLHttpRequest();
				xhr.open('GET',url);
				xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
				xhr.responseType='blob';
				xhr.onload=function(){
					if (xhr.status===200) resolve(xhr.response);
					else reject(Error('File download error:' + xhr.statusText));
				};
				xhr.onerror=function(){
					reject(Error('There was a network error.'));
				};
				xhr.send();
			});
		},
		/* upload */
		upload:function(filename,contentType,data){
			return new Promise(function(resolve,reject)
			{
				var blob=new Blob([data],{type:contentType});
				var filedata=new FormData();
				var xhr=new XMLHttpRequest();
				filedata.append('__REQUEST_TOKEN__',kintone.getRequestToken());
				filedata.append('file',blob,filename);
				xhr.open('POST',encodeURI('/k/v1/file.json'),false);
				xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
				xhr.responseType='multipart/form-data';
				xhr.onload=function(){
					if (xhr.status===200) resolve(xhr.responseText);
					else reject(Error('File upload error:' + xhr.statusText));
				};
				xhr.onerror=function(){
					reject(Error('There was a network error.'));
				};
				xhr.send(filedata);
			});
		},
		setupfilevalue:function(counter,files,callback){
			if (counter<files.length)
			{
				functions.download(files[counter].fileinfo.fileKey).then(function(blob){
					functions.upload(files[counter].fileinfo.name,files[counter].fileinfo.contentType,blob).then(function(resp){
						files[counter].field.value.push({fileKey:JSON.parse(resp).fileKey})
						counter++;
						functions.setupfilevalue(counter,files,callback);
					});
				});
			}
			else callback();
		},
		setupvalue:function(from,to,files){
			switch (from.type)
			{
				case 'FILE':
					to.value=[];
					for (var i=0;i<from.value.length;i++)
						files.push({
							field:to,
							fileinfo:from.value[i]
						})
					break;
				default:
					to.value=from.value;
					break;
			}
		}
	}
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.apps=JSON.parse(vars.config['apps']);
			vars.fieldinfos=resp.properties;
			/* create form */
			if ($('.custom-elements-recordtransfer').size()) $('.custom-elements-recordtransfer').remove();
			if ($('.gaia-app-statusbar').size()) $('.gaia-app-statusbar').css({'display':'inline-block'});
			for (var i=0;i<vars.apps.length;i++)
			{
				(function(app){
					$('.gaia-argoui-app-toolbar-statusmenu').append(
						$('<button type="button" class="recordtransfer-button custom-elements-recordtransfer">').text(app.buttonlabel)
						.on('click',function(e){
							kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:app.app},function(resp){
								var error=false;
								var counter=0;
								var files=[];
								var mappings=[];
								var fieldinfos={};
								var body={
									app:app.app,
									record:{}
								};
								/* append lookup mappings fields */
								fieldinfos=$.fieldparallelize(resp.properties);
								$.each(fieldinfos,function(key,values){
									if (values.lookup)
										$.each(values.lookup.fieldMappings,function(index,values){
											mappings.push(values.field);
										});
								});
								/* setup values */
								fieldinfos=resp.properties;
								$.each(fieldinfos,function(key,values){
									if (error) return false;
									/* check field type */
									switch (values.type)
									{
										case 'CALC':
										case 'CATEGORY':
										case 'CREATED_TIME':
										case 'CREATOR':
										case 'GROUP':
										case 'MODIFIER':
										case 'RECORD_NUMBER':
										case 'REFERENCE_TABLE':
										case 'STATUS':
										case 'STATUS_ASSIGNEE':
										case 'UPDATED_TIME':
											break;
										default:
											switch (values.type)
											{
												case 'SUBTABLE':
													if (values.code in vars.fieldinfos)
													{
														var tablecode=values.code;
														var fields=[];
														var additional=[];
														$.each(values.fields,function(key,values){
															if (!values.expression)
																if ($.inArray(values.code,mappings)<0)
																{
																	if (values.code in vars.fieldinfos[tablecode].fields)
																	{
																		if (values.type==vars.fieldinfos[tablecode].fields[values.code].type) fields.push({from:values.code,to:values.code});
																	}
																	else additional.push(values);
																	for (var i2=0;i2<app.fields.length;i2++)
																	{
																		var field=app.fields[i2];
																		if (field.to==values.code) fields.push({from:field.from,to:field.to});;
																	}
																}
														});
														if (fields.length!=0)
														{
															body.record[tablecode]={value:[]};
															for (var i2=0;i2<event.record[tablecode].value.length;i2++)
															{
																if (error) break;
																var row={value:{}};
																for (var i3=0;i3<fields.length;i3++)
																{
																	var field=fields[i3];
																	row.value[field.to]={value:null};
																	functions.setupvalue(event.record[tablecode].value[i2].value[field.from],row.value[field.to],files);
																}
																for (var i3=0;i3<additional.length;i3++)
																{
																	if (error) break;
																	var field=additional[i3];
																	var value=null;
																	var hasdefault=field.defaultValue;
																	switch (field.type)
																	{
																		case 'CHECK_BOX':
																		case 'FILE':
																		case 'GROUP_SELECT':
																		case 'MULTI_SELECT':
																		case 'ORGANIZATION_SELECT':
																		case 'USER_SELECT':
																			value=[];
																			if (field.type!='FILE') hasdefault=field.defaultValue.length;
																			break;
																	}
																	if (!value) value='';
																	if (value.length==0)
																	{
																		/* check required */
																		if (field.required)
																		{
																			/* check default value */
																			if (hasdefault)
																			{
																				switch (field.type)
																				{
																					case 'CHECK_BOX':
																					case 'MULTI_SELECT':
																						value=field.defaultValue;
																						break;
																					case 'GROUP_SELECT':
																					case 'ORGANIZATION_SELECT':
																					case 'USER_SELECT':
																						value=[];
																						$.each(field.defaultValue,function(index,values){
																							value.push({code:values.code});
																						});
																						break;
																					default:
																						value=field.defaultValue;
																						break;
																				}
																			}
																			else
																			{
																				var date=new Date();
																				switch (field.type)
																				{
																					case 'CHECK_BOX':
																					case 'MULTI_SELECT':
																						value=[field.options[Object.keys(field.options)[0]].label];
																						break;
																					case 'DROP_DOWN':
																					case 'RADIO_BUTTON':
																						value=(function(options){
																							var res='';
																							$.each(options,function(key,values){
																								if (values.index==0) res=key;
																							});
																							return res;
																						})(field.options);
																						break;
																					case 'DATE':
																						if (field.defaultNowValue) value=date.format('Y-m-d');
																						else value='1000-01-01';
																						break;
																					case 'DATETIME':
																						if (field.defaultNowValue)
																						{
																							value='';
																							value+=date.format('Y-m-d');
																							value+='T'+date.getHours().toString().lpad('0',2)+':'+date.getMinutes().toString().lpad('0',2)+':'+date.getSeconds().toString().lpad('0',2)+'+0900';
																						}
																						else value='1000-01-01T00:00:00+0900';
																						break;
																					case 'FILE':
																						swal('Error!','テーブル内の添付ファイルフィールドの入力が必須の場合はコピー出来ません。','error');
																						error=true;
																						break;
																					case 'GROUP_SELECT':
																					case 'ORGANIZATION_SELECT':
																					case 'USER_SELECT':
																						var fieldname=''
																						switch (field.type)
																						{
																							case 'GROUP_SELECT':
																								fieldname='グループ選択';
																								break;
																							case 'ORGANIZATION_SELECT':
																								fieldname='組織選択';
																								break;
																							case 'USER_SELECT':
																								fieldname='ユーザー選択';
																								break;
																						}
																						swal('Error!','テーブル内の'+fieldname+'フィールドの入力が必須の場合は、初期値を設定して下さい。','error');
																						error=true;
																						break;
																					case 'LINK':
																					case 'MULTI_LINE_TEXT':
																					case 'RICH_TEXT':
																					case 'SINGLE_LINE_TEXT':
																						value='必須項目です';
																						break;
																					case 'NUMBER':
																						value=((field.minValue)?field.minValue:((field.maxValue)?field.maxValue:'0'));
																						break;
																					case 'TIME':
																						if (field.defaultNowValue) value=date.getHours().toString().lpad('0',2)+':'+date.getMinutes().toString().lpad('0',2);
																						else value='00:00';
																						break;
																				}
																			}
																		}
																	}
																	row.value[field.code]={value:value};
																}
																body.record[tablecode].value.push(row);
															}
														}
													}
													break;
												default:
													if (!values.expression)
														if ($.inArray(values.code,mappings)<0)
														{
															if (values.code in vars.fieldinfos)
																if (values.type==vars.fieldinfos[values.code].type)
																{
																	body.record[values.code]={value:null}
																	functions.setupvalue(event.record[values.code],body.record[values.code],files);
																}
															for (var i2=0;i2<app.fields.length;i2++)
															{
																var field=app.fields[i2];
																if (field.to==values.code)
																{
																	body.record[field.to]={value:null};
																	functions.setupvalue(event.record[field.from],body.record[field.to],files);
																}
															}
														}
													break;
											}
									}
								});
								if (!error)
									functions.setupfilevalue(counter,files,function(){
										if (Object.keys(body.record).length!==0)
										{
											kintone.api(kintone.api.url('/k/v1/record',true),'POST',body,function(resp){
												window.open(kintone.api.url('/k/', true).replace(/\.json/g,'')+app.app+'/show#record='+resp.id+'&mode=edit');
											},function(error){
												swal('Error!',error.message,'error');
											});
										}
									});
							});
						})
					);
				})(vars.apps[i]);
			}
		});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
