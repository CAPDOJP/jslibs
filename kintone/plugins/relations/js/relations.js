/*
*--------------------------------------------------------------------
* jQuery-Plugin "relations"
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
		fieldinfos:{},
		params:{}
	};
	var events={
		show:[
			'app.record.create.show',
			'app.record.edit.show'
		]
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* get fieldinfo */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fieldinfos=$.fieldparallelize(resp.properties);
			/* get configuration */
			$.each(JSON.parse(vars.config['relations']),function(index,values){
				vars.params[values['basefield']]={
					baseapp:values['baseapp'],
					baseappfield:values['baseappfield'],
					basetype:values['basetype'],
					relations:[]
				};
				var relations=[];
				$.each(values['relations'],function(index,values){
					relations.push({
						relationfield:values['relationfield'],
						relationapp:values['relationapp'],
						relationappfield:values['relationappfield'],
						relationtype:values['relationtype'],
						basecode:values['basecode'],
						relationcode:values['relationcode'],
						lookup:(values['lookup']=='1')?true:false,
						rewrite:(values['rewrite']=='1')?false:true
					});
				});
				vars.params[values['basefield']].relations=relations;
			});
			$.each(vars.params,function(key,values){
				setInterval(function(){
					$.each($('body').fields(key),function(index){
						var base={
							container:$('body'),
							target:$(this),
							value:null
						};
						base.value=(base.target.val())?base.target.val():'';
						if ($.data(base.target[0],'value')==null) $.data(base.target[0],'value','');
						if ($.data(base.target[0],'value')==base.value) return;
						$.data(base.target[0],'value',base.value);
						if (base.value.length!=0)
						{
							var body={
								app:values.baseapp,
								query:''
							};
							switch (values.basetype)
							{
								case 'NUMBER':
								case 'RECORD_NUMBER':
									body.query=values.baseappfield+'='+base.value;
									break;
								case 'SINGLE_LINE_TEXT':
									body.query=values.baseappfield+'="'+base.value+'"';
									break;
							}
							kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
								if (resp.records.length==0) return;
								var counter=0;
								var update=function(myrecord,baserecord,tablecode){
									var relation=values.relations[counter];
									var field=(tablecode)?myrecord.record[tablecode].value[index].value[relation.relationfield]:myrecord.record[relation.relationfield];
									var body={
										app:relation.relationapp,
										query:''
									};
									switch (relation.relationtype)
									{
										case 'NUMBER':
										case 'RECORD_NUMBER':
											body.query=relation.relationcode+'='+baserecord[relation.basecode].value;
											break;
										case 'DROP_DOWN':
										case 'RADIO_BUTTON':
											body.query=relation.relationcode+' in ("'+baserecord[relation.basecode].value+'")';
											break;
										default:
											body.query=relation.relationcode+'="'+baserecord[relation.basecode].value+'"';
											break;
									}
									kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
										var exclude=false;
										if (resp.records.length==0) exclude=true;
										else
										{
											if (!relation.rewrite)
												if (field.value) exclude=true;
										}
										if (!exclude)
										{
											field.value=resp.records[0][relation.relationappfield].value;
											if (relation.lookup) field.lookup=true;
										}
										counter++;
										if (counter<values.relations.length) update(myrecord,baserecord,tablecode);
										else kintone.app.record.set(myrecord);
									},function(error){
										swal('Error!',error.message,'error');
									});
								};
								update(kintone.app.record.get(),resp.records[0],vars.fieldinfos[key].tablecode);
							},function(error){
								swal('Error!',error.message,'error');
							});
						}
					});
				},250);
			});
		},function(error){});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
