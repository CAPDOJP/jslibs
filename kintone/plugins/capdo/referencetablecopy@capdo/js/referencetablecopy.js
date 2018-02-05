/*
*--------------------------------------------------------------------
* jQuery-Plugin "referencetablecopy"
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
		limit:500,
		config:{},
		fieldinfos:{}
	};
	var events={
		show:[
			'app.record.create.show',
			'app.record.edit.show',
			'mobile.app.record.create.show',
			'mobile.app.record.edit.show'
		]
	};
	var functions={
		loadapps:function(counter,param,callback){
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:param[counter].app},function(resp){
				var body={
					app:param[counter].app,
					query:param[counter].query
				};
				body.query+=' order by '+param[counter].sort+' limit '+param[counter].limit.toString()+' offset '+param[counter].offset.toString();
				kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
					Array.prototype.push.apply(param[counter].records,resp.records);
					param[counter].offset+=param[counter].limit;
					if (resp.records.length==param[counter].limit) functions.loadapps(counter,param,callback);
					else
					{
						counter++;
						if (counter<param.length) functions.loadapps(counter,param,callback);
						else callback();
					}
				},function(error){
					swal('Error!',error.message,'error');
				});
			},
			function(error){
				swal('Error!',error.message,'error');
			});
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
			vars.fieldinfos=resp.properties;
			kintone.proxy(
				vars.config['license']+'?domain='+$(location).attr('host').replace(/\.cybozu\.com/g,''),
				'GET',
				{},
				{},
				function(body,status,headers){
					if (status>=200 && status<300)
					{
						var json=JSON.parse(body);
						if (parseInt('0'+json.permit)==0) {swal('Error!','ライセンスが登録されていません。','error');return;}
						/* create button */
						var button=$('<button type="button" class="kintoneplugin-button-dialog-ok gaia-ui-actionmenu-save">')
						.text('関連レコードコピー')
						.on('click',function(e){
							var counter=0;
							var param=[];
							var relations=JSON.parse(vars.config['relation']);
							var record=(event.type.match(/mobile/g)!=null)?kintone.mobile.app.record.get():kintone.app.record.get();
							$.each(relations,function(index){
								var fieldinfo=vars.fieldinfos[relations[index].copyfrom];
								var added=false;
								param.push({
									app:fieldinfo.referenceTable.relatedApp.app,
									query:'',
									sort:fieldinfo.referenceTable.sort,
									limit:vars.limit,
									offset:0,
									records:[],
									table:relations[index].copyto,
									fields:relations[index].fields
								});
								if (fieldinfo.referenceTable.condition.field.length!=0)
								{
									var isnumber=false;
									var field=vars.fieldinfos[fieldinfo.referenceTable.condition.field];
									switch (field.type)
									{
										case 'CALC':
											switch (field.format)
											{
												case 'NUMBER':
												case 'NUMBER_DIGIT':
													isnumber=true;
													break;
											}
											break;
										case 'NUMBER':
										case 'RECORD_NUMBER':
											isnumber=true;
											break;
									}
									if (isnumber) param[param.length-1].query+=fieldinfo.referenceTable.condition.relatedField+'='+record.record[fieldinfo.referenceTable.condition.field].value;
									else param[param.length-1].query+=fieldinfo.referenceTable.condition.relatedField+'="'+record.record[fieldinfo.referenceTable.condition.field].value+'"';
									added=true;
								}
								if (fieldinfo.referenceTable['filterCond'].length!=0)
								{
									if (added) param[param.length-1].query+=' and ';
									param[param.length-1].query+=fieldinfo.referenceTable['filterCond'];
								}
							});
							functions.loadapps(counter,param,function(){
								for (var i=0;i<param.length;i++)
								{
									var fields=vars.fieldinfos[param[i].table].fields;
									record.record[param[i].table].value=[];
									for (var i2=0;i2<param[i].records.length;i2++)
									{
										var cells={value:{}};
										$.each(param[i].fields,function(key,values){
											cells.value[key]={
												type:fields[key].type,
												value:param[i].records[i2][values].value
											};
										});
										record.record[param[i].table].value.push(cells);
									}
								}
								if (event.type.match(/mobile/g)!=null) kintone.mobile.app.record.set(record);
								else kintone.app.record.set(record);
							});
						});
						$('.gaia-argoui-app-edit-buttons').append(button);
					}
					else swal('Error!','ライセンス認証に失敗しました。','error');
				},
				function(error){swal('Error!','ライセンス認証に失敗しました。','error');}
			);
		},function(error){});
	});
})(jQuery,kintone.$PLUGIN_ID);
