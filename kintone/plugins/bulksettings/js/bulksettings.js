/*
*--------------------------------------------------------------------
* jQuery-Plugin "bulksettings"
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
	/*---------------------------------------------------------------
	 valiable
	---------------------------------------------------------------*/
	var vars={
		bulks:null,
		settings:null,
		bulkinfos:{},
		settinginfos:{}
	};
	var events={
		lists:[
			'app.record.index.show'
		],
		show:[
			'app.record.create.show',
			'app.record.edit.show'
		]
	};
	var functions={
		fieldmapping:function(fieldinfos){
			var mappings=[];
			$.each(fieldinfos,function(key,values){
				switch (values.type)
				{
					case 'SUBTABLE':
						$.merge(mappings,functions.fieldmapping(values.fields));
						break;
					default:
						if (values.lookup)
							$.each(values.lookup.fieldMappings,function(index,values){
								mappings.push(values.field);
							});
						break;
				}
			});
			return mappings;
		},
		fieldsort:function(layout){
			var codes=[];
			$.each(layout,function(index,values){
				switch (values.type)
				{
					case 'ROW':
						$.each(values.fields,function(index,values){
							/* exclude spacer */
							if (!values.elementId) codes.push({code:values.code,cells:[]});
						});
						break;
					case 'GROUP':
						$.merge(codes,functions.fieldsort(values.layout));
						break;
					case 'SUBTABLE':
						var cells=[];
						$.each(values.fields,function(index,values){
							/* exclude spacer */
							if (!values.elementId) cells.push(values.code);
						});
						codes.push({code:values.code,cells:cells});
						break;
				}
			});
			return codes;
		},
		formatvalue:function(fieldinfo){
			var res=null;
			switch (fieldinfo.type)
			{
				case 'GROUP_SELECT':
				case 'ORGANIZATION_SELECT':
				case 'USER_SELECT':
					res=[];
					$.each(fieldinfo.defaultValue,function(index){
						res.push({code:fieldinfo.defaultValue[index].code});
					});
					break;
				default:
					res=fieldinfo.defaultValue;
					break;
			}
			return res;
		},
		loadfieldinfos:function(type){
			if ($('.settingform',$('body')).size()) return;
			vars.bulkinfos={};
			vars.settinginfos={};
			/* get layout */
			kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
				var sorted=functions.fieldsort(resp.layout);
				/* get fieldinfo */
				kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
					var fieldinfos=resp.properties;
					var mappings=functions.fieldmapping(resp.properties);
					$.each(sorted,function(index){
						var fieldcode=sorted[index];
						if (fieldcode.code in fieldinfos)
						{
							var fieldinfo=fieldinfos[fieldcode.code];
							if (fieldinfo.type=='SUBTABLE')
							{
								vars.settinginfos[fieldcode.code]=$.extend(true,{},fieldinfo);
								vars.settinginfos[fieldcode.code].fields={};
								for (var i=0;i<fieldcode.cells.length;i++)
								{
									var cellinfo=$.extend(true,{},fieldinfo.fields[fieldcode.cells[i]]);
									var ismapping=(!($.inArray(fieldcode.cells[i],mappings)<0));
									vars.settinginfos[fieldcode.code].fields[fieldcode.cells[i]]=cellinfo;
									vars.settinginfos[fieldcode.code].fields[fieldcode.cells[i]]['ismapping']=ismapping;
									/* check defaultValue */
									if (('defaultValue' in cellinfo) && !ismapping)
									{
										vars.bulkinfos[fieldcode.cells[i]]=cellinfo;
										vars.bulkinfos[fieldcode.cells[i]]['tablecode']=fieldcode.code;
									}
								}
							}
							else
							{
								var ismapping=(!($.inArray(fieldinfo.code,mappings)<0));
								/* check required */
								if ('required' in fieldinfo)
								{
									vars.settinginfos[fieldcode.code]=$.extend(true,{},fieldinfo);
									vars.settinginfos[fieldcode.code]['ismapping']=ismapping;
								}
								/* check defaultValue */
								if (('defaultValue' in fieldinfo) && !ismapping)
								{
									vars.bulkinfos[fieldcode.code]=$.extend(true,{},fieldinfo);
									vars.bulkinfos[fieldcode.code]['tablecode']='';
								}
							}
						}
					});
					if (!$('.settingbutton',$('body')).size())
					{
						var button=$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/function.svg" class="settingbutton" alt="フィールド情報編集" title="フィールド情報編集" />').css({
							'cursor':'pointer',
							'display':'inline-block',
							'height':'48px',
							'margin':'0px 12px',
							'vertical-align':'top',
							'width':'48px'
						})
						.on('click',function(e){vars.settings.show()});
						if (type=='list') kintone.app.getHeaderMenuSpaceElement().appendChild(button[0]);
						else $('.gaia-argoui-app-edit-buttons').append(button);
					}
					if (!$('.bulkbutton',$('body')).size())
					{
						var button=$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/edit.svg" class="bulkbutton" alt="フィールド一括更新" title="フィールド一括更新" />').css({
							'cursor':'pointer',
							'display':'inline-block',
							'height':'48px',
							'margin':'0px 12px',
							'vertical-align':'top',
							'width':'48px'
						})
						.on('click',function(e){
							var datasource=[];
							$.each(vars.bulkinfos,function(key,values){
								datasource.push({
									text:values.label,
									value:key
								});
							});
							vars.bulks.show({
								datasource:datasource,
								buttons:{
									ok:function(selection){
										/* close the bulks */
										vars.bulks.hide();
										if (Object.keys(selection).length==0) return;
										var labels=[];
										$.each(selection,function(key,values){
											labels.push(vars.bulkinfos[key].label);
										});
										swal({
											title:'確認',
											text:'表示レコード内の'+labels.join('・')+'を各フィールドの初期値で更新します。\n宜しいですか?',
											type:'warning',
											showCancelButton:true,
											confirmButtonText:'OK',
											cancelButtonText:"キャンセル"
										},
										function(){
											functions.showloading();
											kintone.api(kintone.api.url('/k/v1/records',true),'GET',{app:kintone.app.getId(),query:kintone.app.getQuery()},function(resp){
												var body={
													app:kintone.app.getId(),
													records:[]
												};
												for (var i=0;i<resp.records.length;i++)
												{
													var record={};
													$.each(resp.records[i],function(key,values){
														switch (values.type)
														{
															case 'CALC':
															case 'CATEGORY':
															case 'CREATED_TIME':
															case 'CREATOR':
															case 'MODIFIER':
															case 'RECORD_NUMBER':
															case 'STATUS':
															case 'STATUS_ASSIGNEE':
															case 'UPDATED_TIME':
																break;
															default:
																record[key]=values;
																break;
														}
													});
													$.each(selection,function(key,values){
														if (vars.bulkinfos[key]['tablecode'].length!=0)
														{
															var tablecode=vars.bulkinfos[key]['tablecode'];
															for (var i2=0;i2<record[tablecode].value.length;i2++)
															{
																var cells=record[tablecode].value[i2].value;
																cells[key].value=functions.formatvalue(vars.settinginfos[tablecode].fields[key]);
															}
														}
														else record[key].value=functions.formatvalue(vars.settinginfos[key]);
													});
													body.records.push({
														id:record['$id'].value,
														record:record
													});
												}
												kintone.api(kintone.api.url('/k/v1/records',true),'PUT',body,function(resp){
													functions.hideloading();
													swal({
														title:'更新完了',
														text:'更新完了',
														type:'success'
													},function(){location.reload(true);});
												},function(error){
													functions.hideloading();
													swal('Error!',error.message,'error');
												});
											},function(error){
												functions.hideloading();
												swal('Error!',error.message,'error');
											});
										});
									},
									cancel:function(){
										/* close the bulks */
										vars.bulks.hide();
									}
								}
							});
						});
						if (type=='list') kintone.app.getHeaderMenuSpaceElement().appendChild(button[0]);
					}
					vars.bulks=$('body').multiselect();
					vars.settings=new settingform({fieldinfos:vars.settinginfos});
				},function(error){});
			},function(error){});
		},
		showloading:function(){
			if (!$('div#loading').size()) $('body').append($('<div id="loading">'));
			$('div#loading').show();
		},
		hideloading:function(){
			$('div#loading').hide();
		}
	};
	var settingform=function(options){
		var options=$.extend({
			fieldinfos:{}
		},options);
		/* property */
		this.fieldinfos=options.fieldinfos;
		this.cells={
			label:{
				caption:'フィールド名',
				control:'textline'
			},
			code:{
				caption:'フィールドコード',
				control:'textline'
			},
			required:{
				caption:'必須',
				control:'checkbox',
				label:'必須項目'
			},
			unique:{
				caption:'重複',
				control:'checkbox',
				label:'重複禁止'
			},
			defaultValue:{
				caption:'初期値',
				control:'referer'
			}
		};
		this.inputforms={};
		this.size={
			checkbox:100,
			referer:200
		};
		/* create elements */
		var my=this;
		var div=$('<div>').css({
			'box-sizing':'border-box',
			'margin':'0px',
			'padding':'0px',
			'position':'relative',
			'vertical-align':'top'
		});
		var button=$('<button>').css({
			'background-color':'transparent',
			'border':'none',
			'box-sizing':'border-box',
			'color':'#FFFFFF',
			'cursor':'pointer',
			'font-size':'13px',
			'height':'auto',
			'line-height':'30px',
			'margin':'0px 3px',
			'outline':'none',
			'padding':'0px 1em',
			'vertical-align':'top',
			'width':'auto'
		});
		var checkbox=$('<label>').css({
			'box-sizing':'border-box',
			'display':'inline-block',
			'line-height':'30px',
			'margin':'0px',
			'padding':'0px 5px',
			'vertical-align':'top',
			'width':this.size.checkbox.toString()+'px'
		})
		.append($('<input type="checkbox" class="receiver">'))
		.append($('<span class="label">').css({'color':'#3498db','padding':'0px 5px'}));
		var referer=div.clone(true).css({
			'display':'inline-block',
			'height':'30px',
			'line-height':'30px',
			'width':this.size.referer.toString()+'px'
		})
		.append(
			$('<span class="label">').css({
				'box-sizing':'border-box',
				'display':'inline-block',
				'overflow':'hidden',
				'padding-left':'35px',
				'padding-right':'35px',
				'text-overflow':'ellipsis',
				'white-space':'nowrap',
				'width':'100%'
			})
		)
		.append(
			button.clone(true).addClass('referer').css({
				'left':'0px',
				'margin':'0px',
				'padding':'0px',
				'position':'absolute',
				'top':'0px',
				'width':'30px'
			})
			.append($('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/search.png">').css({'width':'100%'}))
			.on('click',function(){
				var row=$(this).closest('.fields');
				var fieldinfo=($.data(row[0],'tablecode').length!=0)?my.fieldinfos[$.data(row[0],'tablecode')].fields[row.attr('id')]:my.fieldinfos[row.attr('id')];
				var values={};
				values[fieldinfo.code]={type:fieldinfo.type,value:fieldinfo.defaultValue};
				switch (fieldinfo.type)
				{
					case 'GROUP_SELECT':
					case 'ORGANIZATION_SELECT':
					case 'USER_SELECT':
						var source=my.loadsource(fieldinfo);
						$.each(values[fieldinfo.code].value,function(index){
							var search=values[fieldinfo.code].value[index];
							var texts=$.grep(source,function(item,index){
								return item.value==search.code;
							});
							if (texts.length!=0) search['name']=texts[0].text;
						});
						break;
				}
				my.inputforms[fieldinfo.code].show({
					buttons:{
						ok:function(){
							/* close inputform */
							my.inputforms[fieldinfo.code].hide();
							var contents=$('#'+fieldinfo.code,my.inputforms[fieldinfo.code].contents);
							var receivevalue=$('.receiver',contents).val();
							var receivevalues=[];
							switch (fieldinfo.type)
							{
								case 'CHECK_BOX':
								case 'MULTI_SELECT':
									$.each($('.receiver:checked',contents),function(){receivevalues.push($(this).val());});
									fieldinfo.defaultValue=receivevalues;
									break;
								case 'GROUP_SELECT':
								case 'ORGANIZATION_SELECT':
								case 'USER_SELECT':
									var codes=receivevalue.split(',');
									for (var i=0;i<codes.length;i++)
										if (codes[i].length!=0) receivevalues.push({code:codes[i],type:fieldinfo.type.replace('_SELECT','')});
									fieldinfo.defaultValue=receivevalues;
									break;
								case 'RADIO_BUTTON':
									receivevalue=$('[name='+fieldinfo.code+']:checked',contents).val();
									fieldinfo.defaultValue=receivevalue;
									break;
								default:
									fieldinfo.defaultValue=receivevalue;
									break;
							}
							$('.label',$('.defaultValue',row)).text(my.formatvalue(row,fieldinfo));
						},
						cancel:function(){
							/* close inputform */
							my.inputforms[fieldinfo.code].hide();
						}
					},
					values:values
				});
			})
		)
		.append(
			button.clone(true).addClass('clear').css({
				'margin':'0px',
				'padding':'0px',
				'position':'absolute',
				'right':'0px',
				'top':'0px',
				'width':'30px'
			})
			.append($('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/close.png">').css({'width':'100%'}))
			.on('click',function(){
				var row=$(this).closest('.fields');
				var fieldinfo=($.data(row[0],'tablecode').length!=0)?my.fieldinfos[$.data(row[0],'tablecode')].fields[row.attr('id')]:my.fieldinfos[row.attr('id')];
				switch (fieldinfo.type)
				{
					case 'CHECK_BOX':
					case 'MULTI_SELECT':
						fieldinfo.defaultValue=[];
						break;
					case 'GROUP_SELECT':
					case 'ORGANIZATION_SELECT':
					case 'USER_SELECT':
						fieldinfo.defaultValue=[];
						break;
					default:
						fieldinfo.defaultValue='';
						break;
				}
				$('.label',$('.defaultValue',row)).text('');
			})
		);
		var textline=div.clone(true).css({
			'display':'inline-block',
			'padding':'0px 5px',
			'vertical-align':'top',
			'width':'calc(50% - '+((this.size.checkbox*2+this.size.referer)/2).toString()+'px)'
		})
		.append(
			$('<input type="text" class="receiver">').css({
				'border':'1px solid #3498db',
				'border-radius':'2px',
				'box-sizing':'border-box',
				'display':'lnline-block',
				'height':'30px',
				'line-height':'30px',
				'margin':'0px',
				'padding':'0px 5px',
				'vertical-align':'top',
				'width':'100%'
			})
		);
		/* append elements */
		this.cover=div.clone(true).css({
			'background-color':'rgba(0,0,0,0.5)',
			'display':'none',
			'height':'100%',
			'left':'0px',
			'position':'fixed',
			'top':'0px',
			'width':'100%',
			'z-index':'888888'
		});
		this.container=div.clone(true).css({
			'background-color':'#FFFFFF',
			'bottom':'0',
			'border-radius':'5px',
			'box-shadow':'0px 0px 3px rgba(0,0,0,0.35)',
			'left':'0',
			'margin':'auto',
			'max-height':'90%',
			'max-width':'90%',
			'padding':'5px',
			'position':'absolute',
			'right':'0',
			'text-align':'center',
			'top':'0',
			'width':'800px'
		});
		this.contents=div.clone(true).css({
			'height':'100%',
			'margin':'0px',
			'overflow-x':'hidden',
			'overflow-y':'auto',
			'padding':'5px',
			'position':'relative',
			'text-align':'left',
			'width':'100%',
			'z-index':'1'
		});
		this.buttonblock=div.clone(true).css({
			'background-color':'#3498db',
			'border-bottom-left-radius':'5px',
			'border-bottom-right-radius':'5px',
			'bottom':'0px',
			'left':'0px',
			'padding':'5px',
			'position':'absolute',
			'text-align':'center',
			'width':'100%',
			'z-index':'2'
		});
		/* append captions */
		this.captions=$('<p>').css({'border-bottom':'1px solid #3498db','margin':'0px','padding':'0px','width':'100%'});
		$.each(this.cells,function(key,values){
			var cell=$('<span>').css({
				'box-sizing':'border-box',
				'color':'#3498db',
				'display':'inline-block',
				'line-height':'30px',
				'margin':'0px',
				'padding':'0px',
				'text-align':'center',
				'vertical-align':'top'
			});
			switch (values.control)
			{
				case 'textline':
					cell.css({'width':'calc(50% - '+((my.size.checkbox*2+my.size.referer)/2).toString()+'px)'}).text(values.caption);
					break;
				case 'checkbox':
					cell.css({'width':my.size.checkbox.toString()+'px'}).text(values.caption);
					break;
				case 'referer':
					cell.css({'width':my.size.referer.toString()+'px'}).text(values.caption);
					break;
			}
			my.captions.append(cell);
		});
		this.contents.append(this.captions);
		/* append fields */
		this.template=div.clone(true).addClass('fields').css({'border-bottom':'1px dotted #3498db','padding':'5px 0px','width':'100%'})
		$.each(this.cells,function(key,values){
			var cell=null;
			switch (values.control)
			{
				case 'textline':
					cell=textline.clone(true).addClass(key);
					break;
				case 'checkbox':
					cell=checkbox.clone(true).addClass(key);
					$('.label',cell).text(values.label);
					break;
				case 'referer':
					cell=referer.clone(true).addClass(key);
					break;
			}
			my.template.append(cell);
		});
		this.appendrows(this.fieldinfos,'');
		/* append buttons */
		this.buttonblock
		.append(
			button.clone(true)
			.text('OK')
			.on('click',function(e){
				$.each($('.fields',my.contents),function(index){
					var row=$(this);
					var fieldinfo=($.data(row[0],'tablecode').length!=0)?my.fieldinfos[$.data(row[0],'tablecode')].fields[row.attr('id')]:my.fieldinfos[row.attr('id')];
					$.each(my.cells,function(key,values){
						switch (values.control)
						{
							case 'textline':
								fieldinfo[key]=$('.receiver',$('.'+key,row)).val();
								break;
							case 'checkbox':
								if ($('.'+key,row).is(':visible')) fieldinfo[key]=$('.receiver',$('.'+key,row)).prop('checked');
								break;
						}
					});
				});
				kintone.api(kintone.api.url('/k/v1/preview/app/form/fields',true),'PUT',{app:kintone.app.getId(),properties:my.fieldinfos},function(resp){
					kintone.api(kintone.api.url('/k/v1/preview/app/deploy',true),'POST',{apps:[{app:kintone.app.getId()}]},function(resp){
						var waitprocess=function(){
							setTimeout(function(){
								kintone.api(kintone.api.url('/k/v1/preview/app/deploy',true),'GET',{apps:[kintone.app.getId()]},function(resp){
									switch (resp.apps[0].status)
									{
										case 'PROCESSING':
											waitprocess();
											break;
										case 'SUCCESS':
											functions.hideloading();
											my.hide();
											swal({
												title:'更新完了',
												text:'フォーム設定を変更しました。',
												type:'success'
											},function(){location.reload(true);});
											break;
										case 'FAIL':
											functions.hideloading();
											my.hide();
											swal('Error!','フォーム設定の更新に失敗しました。\nアプリの設定画面を開いてエラー内容を確認して下さい。','error');
											break;
										case 'CANCEL':
											functions.hideloading();
											my.hide();
											swal('Error!','フォーム設定の更新がキャンセルされました。','error');
											break;
									}
								},
								function(error){
									my.hide();
									swal('Error!',error.message,'error');
								});
							},500);
						};
						functions.showloading();
						waitprocess();
					},
					function(error){
						my.hide();
						swal('Error!',error.message,'error');
					});
				},
				function(error){
					my.hide();
					swal('Error!',error.message,'error');
				});
			})
		)
		.append(
			button.clone(true)
			.text('キャンセル')
			.on('click',function(e){my.hide();})
		);
		this.container.append(this.contents);
		this.container.append(this.buttonblock);
		this.cover.append(this.container);
		$('body').append(this.cover.addClass('settingform'));
		/* adjust container height */
		$(window).on('load resize',function(){
			my.contents.css({'height':(my.container.innerHeight()-my.buttonblock.outerHeight(true)).toString()+'px'});
		});
	};
	settingform.prototype={
		/* append rows */
		appendrows:function(fieldinfos,tablecode){
			var my=this;
			$.each(fieldinfos,function(key,values){
				if (values.type=='SUBTABLE') my.appendrows(values.fields,key);
				else
				{
					var fieldinfo=values;
					if ('required' in fieldinfo)
					{
						var row=my.template.clone(true).attr('id',fieldinfo.code);
						$.data(row[0],'tablecode',tablecode);
						$.each(my.cells,function(key,values){
							switch (values.control)
							{
								case 'textline':
									$('.receiver',$('.'+key,row)).val(fieldinfo[key]);
									break;
								case 'checkbox':
									if (key in fieldinfo) $('.receiver',$('.'+key,row)).prop('checked',fieldinfo[key]);
									else $('.'+key,row).css({'visibility':'hidden'});
									break;
								case 'referer':
									if ((key in fieldinfo) && !fieldinfo.ismapping)
									{
										my.inputforms[fieldinfo.code]=$('body').fieldsform({
											fields:[fieldinfo],
											callback:{
												group:function(){$('.label',$('.'+key,row)).text(my.formatvalue(row,fieldinfo))},
												organization:function(){$('.label',$('.'+key,row)).text(my.formatvalue(row,fieldinfo))},
												user:function(){$('.label',$('.'+key,row)).text(my.formatvalue(row,fieldinfo))}
											}
										});
										switch (fieldinfo.type)
										{
											case 'GROUP_SELECT':
											case 'ORGANIZATION_SELECT':
											case 'USER_SELECT':
												break;
											default:
												$('.label',$('.'+key,row)).text(my.formatvalue(row,fieldinfo));
												break;
										}
										if (fieldinfo.type=='RADIO_BUTTON') $('.clear',$('.'+key,row)).hide();
									}
									else $('.'+key,row).css({'visibility':'hidden'});
									break;
							}
						});
						my.contents.append(row);
					}
				}
			});
		},
		/* format display value */
		formatvalue:function(row,fieldinfo){
			var res='';
			switch (fieldinfo.type)
			{
				case 'CHECK_BOX':
				case 'MULTI_SELECT':
					res=fieldinfo.defaultValue.join(',');
					break;
				case 'DATETIME':
					fieldinfo.defaultValue=fieldinfo.defaultValue.replace(/\.000Z$/g,'Z');
					if (fieldinfo.defaultValue.length!=0) res=new Date(fieldinfo.defaultValue.dateformat()).format('Y-m-d H:i');
					break;
				case 'GROUP_SELECT':
				case 'ORGANIZATION_SELECT':
				case 'USER_SELECT':
					var source=this.loadsource(fieldinfo);
					var text=[];
					$.each(fieldinfo.defaultValue,function(index){
						var search=fieldinfo.defaultValue[index];
						var texts=$.grep(source,function(item,index){
							return item.value==search.code;
						});
						if (texts.length!=0) text.push(texts[0].text);
					});
					res=text.join(',');
					break;
				case 'TIME':
					fieldinfo.defaultValue=fieldinfo.defaultValue.replace(/:00.000$/g,'');
					res=fieldinfo.defaultValue;
					break;
				default:
					res=fieldinfo.defaultValue;
					break;
			}
			return res;
		},
		/* load group organization user source */
		loadsource:function(fieldinfo){
			var source=[];
			switch (fieldinfo.type)
			{
				case 'GROUP_SELECT':
					source=this.inputforms[fieldinfo.code].groupsource;
					break;
				case 'ORGANIZATION_SELECT':
					source=this.inputforms[fieldinfo.code].organizationsource;
					break;
				case 'USER_SELECT':
					source=this.inputforms[fieldinfo.code].usersource;
					break;
			}
			return source;
		},
		/* display form */
		show:function(){
			/* display form */
			this.cover.show();
			/* adjust container height */
			this.contents.css({'height':(this.container.innerHeight()-this.buttonblock.outerHeight(true)).toString()+'px'});
		},
		/* hide form */
		hide:function(){
			this.cover.hide();
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		/* load fieldinfos */
		functions.loadfieldinfos('list');
		return event;
	});
	kintone.events.on(events.show,function(event){
		/* load fieldinfos */
		functions.loadfieldinfos('show');
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
