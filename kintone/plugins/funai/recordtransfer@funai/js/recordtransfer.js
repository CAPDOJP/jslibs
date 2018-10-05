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
		config:{},
		fieldinfos:{}
	};
	var events={
		show:[
			'app.record.create.show',
			'app.record.edit.show',
			'app.record.detail.show'
		],
		save:[
			'app.record.create.submit.success',
			'app.record.edit.submit.success',
			'app.record.index.edit.submit.success'
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
				xhr.open('POST',encodeURI('https://'+vars.config['subdomain']+'.cybozu.com/k'+vars.config['guest']+'/v1/file.json'),false);
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
		regist:function(registbody,method,retry,callback){
			kintone.proxy(
				'https://'+vars.config['subdomain']+'.cybozu.com/k'+vars.config['guest']+'/v1/record.json',
				method,
				{
					'Content-Type':'application/json',
					'X-Cybozu-API-Token':vars.config['token']
				},
				registbody,
				function(body,status,headers){
					if (status==200)
					{
						var res=JSON.parse(body);
						callback(('id' in res)?res.id:null);
					}
					else
					{
						if (retry)
						{
							if ('id' in registbody) delete registbody.id;
							functions.regist(registbody,'POST',false,callback);
						}
						else
						{
							var res=JSON.parse(body);
							swal({
								title:'Error!',
								text:res.message,
								type:'error'
							},function(){callback();});
						}
					}
				},
				function(error){
					swal({
						title:'Error!',
						text:error,
						type:'error'
					},function(){callback();});
				}
			);
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
		kintone.app.record.setFieldShown(vars.config['recordid'],false);
		return event;
	});
	kintone.events.on(events.save,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		return new kintone.Promise(function(resolve,reject){
			/* get fields of app */
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				vars.fieldinfos=resp.properties;
				kintone.proxy(
					'https://'+vars.config['subdomain']+'.cybozu.com/k'+vars.config['guest']+'/v1/form.json?app='+vars.config['appid'],
					'GET',
					{
						'X-Cybozu-API-Token':vars.config['token']
					},
					{},
					function(body,status,headers){
						if (status==200)
						{
							var res=JSON.parse(body);
							var error=false;
							var counter=0;
							var files=[];
							var mappings=[];
							var fieldinfos={};
							var body={
								app:vars.config['appid'],
								record:{}
							};
							if (event.record[vars.config['recordid']].value) body['id']=event.record[vars.config['recordid']].value;
							/* append lookup mappings fields */
							fieldinfos=$.fieldparallelize(res.properties);
							$.each(fieldinfos,function(key,values){
								if (values.lookup)
									$.each(values.lookup.fieldMappings,function(index,values){
										mappings.push(values.field);
									});
							});
							/* setup values */
							fieldinfos=res.properties;
							$.each(fieldinfos,function(key,values){
								if (error) return false;
								/* check field type */
								values.required=(values.required=='true')?true:false;
								switch (values.type)
								{
									case 'CALC':
									case 'CATEGORY':
									case 'CREATED_TIME':
									case 'CREATOR':
									case 'GROUP':
									case 'HR':
									case 'LABEL':
									case 'MODIFIER':
									case 'RECORD_NUMBER':
									case 'REFERENCE_TABLE':
									case 'SPACER':
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
																var res=$.fielddefault(field);
																if (res.error)
																{
																	swal('Error!',res.error,'error');
																	error=true;
																}
																else row.value[field.code]={value:res.value};
															}
															body.record[tablecode].value.push(row);
														}
													}
												}
												break;
											default:
												if (values.code!=vars.config['recordid'])
													if (!values.expression)
														if ($.inArray(values.code,mappings)<0)
														{
															var res=$.fielddefault(values);
															body.record[values.code]={value:res.value};
															if (values.code in vars.fieldinfos)
																if (values.type==vars.fieldinfos[values.code].type)	functions.setupvalue(event.record[values.code],body.record[values.code],files);
															if (res.error)
															{
																var value=(body.record[values.code].value)?body.record[values.code].value:null;
																if (!value) value='';
																if (value.length==0)
																{
																	swal('Error!',res.error,'error');
																	error=true;
																}
															}
														}
												break;
										}
										break;
								}
							});
							if (!error)
							{
								functions.setupfilevalue(counter,files,function(){
									if (Object.keys(body.record).length!==0)
									{
										if (vars.config['decisionfield']) body.record[vars.config['decisionfield']]={value:vars.config['decisionvalue']};
										functions.regist(body,(('id' in body)?'PUT':'POST'),true,function(id){
											if (id)
											{
												body={
													app:kintone.app.getId(),
													id:event.record['$id'].value,
													record:{}
												};
												body.record[vars.config['recordid']]={value:id};
												kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
													resolve(event);
												},function(error){
													swal('Error!',error.message,'error');
													resolve(event);
												});
											}
											else resolve(event);
										});
									}
								});
							}
							else resolve(event);
						}
						else
						{
							var res=JSON.parse(body);
							swal({
								title:'Error!',
								text:res.message,
								type:'error'
							},function(){resolve(event);});
						}
					},
					function(error){
						swal({
							title:'Error!',
							text:error,
							type:'error'
						},function(){resolve(event);});
					}
				);
			});
		});
	});
})(jQuery,kintone.$PLUGIN_ID);
