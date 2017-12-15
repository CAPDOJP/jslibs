/*
*--------------------------------------------------------------------
* jQuery-Plugin "relations -config.js-"
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
	var vars={
		relationtable:null,
		fieldtable:[],
		appnames:{},
		fieldinfos:{},
		offset:0,
		types:[
			'DATE',
			'DATETIME',
			'DROP_DOWN',
			'LINK',
			'MULTI_LINE_TEXT',
			'NUMBER',
			'RADIO_BUTTON',
			'RECORD_NUMBER',
			'SINGLE_LINE_TEXT',
			'TIME'
		]
	};
	var functions={
		fieldsort:function(layout){
			var codes=[];
			$.each(layout,function(index,values){
				switch (values.type)
				{
					case 'ROW':
						$.each(values.fields,function(index,values){
							/* exclude spacer */
							if (!values.elementId) codes.push(values.code);
						});
						break;
					case 'GROUP':
						$.merge(codes,functions.fieldsort(values.layout));
						break;
					case 'SUBTABLE':
						$.each(values.fields,function(index,values){
							/* exclude spacer */
							if (!values.elementId) codes.push(values.code);
						});
						break;
				}
			});
			return codes;
		},
		loadapps:function(callback){
			kintone.api(kintone.api.url('/k/v1/apps',true),'GET',{offset:vars.offset},function(resp){
				/* setup app lists */
				$.each(resp.apps,function(index,values){
					if (values.appId!=kintone.app.getId())
					{
						$('select#relationapp').append($('<option>').attr('value',values.appId).text(values.name));
						vars.appnames[values.appId]=values.name;
					}
				})
				vars.offset+=100;
				if (resp.apps.length==100) functions.loadapps(callback);
				else
				{
					if (callback!=null) callback();
				}
			},function(error){});
		},
		reloadbase:function(target,row){
			var appid='';
			var appname='';
			/* initialize field lists */
			$.each($('select#basecode',row),function(index){$(this).html('<option value=""></option>');});
			if (target.val().length!=0)
			{
				appid=vars.fieldinfos[target.val()].lookup.relatedApp.app;
				appname=vars.appnames[appid];
				kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:appid},function(resp){
					var sorted=functions.fieldsort(resp.layout);
					/* get fieldinfo */
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:appid},function(resp){
						var fieldinfos=$.fieldparallelize(resp.properties);
						/* setup field lists */
						$.each($('select#basecode',row),function(index){
							var list=$(this);
							$.each(sorted,function(index){
								if (sorted[index] in fieldinfos)
								{
									var fieldinfo=fieldinfos[sorted[index]];
									list.append($('<option>').attr('value',fieldinfo.code).text('['+appname+']'+fieldinfo.label));
								}
							});
							if ($.hasData(list[0]))
								if ($.data(list[0],'initialdata').length!=0)
								{
									list.val($.data(list[0],'initialdata'));
									$.data(list[0],'initialdata','');
								}
						});
					},function(error){});
				},function(error){});
			}
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	functions.loadapps(function(){
		kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
			var sorted=functions.fieldsort(resp.layout);
			/* get fieldinfo */
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				var config=kintone.plugin.app.getConfig(PLUGIN_ID);
				vars.fieldinfos=$.fieldparallelize(resp.properties);
				$.each(sorted,function(index){
					if (sorted[index] in vars.fieldinfos)
					{
						var fieldinfo=vars.fieldinfos[sorted[index]];
						if ($.inArray(fieldinfo.type,vars.types)>-1)
						{
							if (fieldinfo.lookup) $('select#basefield').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#relationfield').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
						}
					}
				});
				/* initialize valiable */
				vars.relationtable=$('.relations').adjustabletable({
					add:'img.addbase',
					del:'img.delbase',
					addcallback:function(row){
						vars.fieldtable.push(
							$('.fields',row).adjustabletable({
								add:'img.addrelation',
								del:'img.delrelation',
								addcallback:function(row){
									functions.reloadbase($('select#basefield',row.closest('.relation')),row);
									$('select#relationapp',row).on('change',function(){
										var appid=$(this).val();
										var appname='';
										var listappfield=$('select#relationappfield',row);
										var listcode=$('select#relationcode',row);
										/* initialize field lists */
										listappfield.html('<option value=""></option>');
										listcode.html('<option value=""></option>');
										if ($(this).val().length!=0)
										{
											appname=$(this).find('option:selected').text();
											kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:appid},function(resp){
												var sorted=functions.fieldsort(resp.layout);
												/* get fieldinfo */
												kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:appid},function(resp){
													var fieldinfos=$.fieldparallelize(resp.properties);
													$.each(sorted,function(index){
														if (sorted[index] in fieldinfos)
														{
															var fieldinfo=fieldinfos[sorted[index]];
															/* setup field lists */
															listappfield.append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
															listcode.append($('<option>').attr('value',fieldinfo.code).text('['+appname+']'+fieldinfo.label));
														}
													});
													if ($.hasData(listappfield[0]))
														if ($.data(listappfield[0],'initialdata').length!=0)
														{
															listappfield.val($.data(listappfield[0],'initialdata'));
															$.data(listappfield[0],'initialdata','');
														}
													if ($.hasData(listcode[0]))
														if ($.data(listcode[0],'initialdata').length!=0)
														{
															listcode.val($.data(listcode[0],'initialdata'));
															$.data(listcode[0],'initialdata','');
														}
												},function(error){});
											},function(error){});
										}
									});
								}
							})
						);
						$('select#basefield',row).on('change',function(){
							functions.reloadbase($(this),row);
						});
					}
				});
				var addrelations=false;
				var addfields=false;
				var rowrelations=null;
				var rowfields=null;
				var fields=[];
				var relations={};
				if (Object.keys(config).length!==0)
				{
					relations=JSON.parse(config['relations']);
					for (var i=0;i<relations.length;i++)
					{
						if (addrelations) vars.relationtable.addrow();
						else addrelations=true;
						rowrelations=vars.relationtable.rows.eq(i);
						$('select#basefield',rowrelations).val(relations[i]['basefield']);
						addfields=false;
						for (var i2=0;i2<relations[i]['relations'].length;i2++)
						{
							if (addfields) vars.fieldtable[i].addrow();
							else addfields=true;
							rowfields=vars.fieldtable[i].rows.eq(i2);
							$('select#relationfield',rowfields).val(relations[i]['relations'][i2]['relationfield']);
							$('select#relationapp',rowfields).val(relations[i]['relations'][i2]['relationapp']);
							if (relations[i]['relations'][i2]['rewrite']=='1') $('input#rewrite',rowfields).prop('checked',true);
							/* trigger events */
							$.data($('select#relationappfield',rowfields)[0],'initialdata',relations[i]['relations'][i2]['relationappfield']);
							$.data($('select#basecode',rowfields)[0],'initialdata',relations[i]['relations'][i2]['basecode']);
							$.data($('select#relationcode',rowfields)[0],'initialdata',relations[i]['relations'][i2]['relationcode']);
							$('select#relationapp',rowfields).trigger('change');
						}
						/* trigger events */
						$('select#basefield',rowrelations).trigger('change');
					}
				}
			},function(error){});
		},function(error){});
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var error=false;
		var tablecode='';
		var rowrelations=null;
		var rowfields=null;
		var config=[];
		var relations=[];
		/* check values */
		for (var i=0;i<vars.relationtable.rows.length;i++)
		{
			var values={};
			rowrelations=vars.relationtable.rows.eq(i);
			tablecode=vars.fieldinfos[$('select#basefield',rowrelations).val()].tablecode;
			if ($('select#basefield',rowrelations).val()=='')
			{
				swal('Error!','基準フィールドを選択して下さい。','error');
				error=true;
				return;
			}
			values['basefield']=$('select#basefield',rowrelations).val();
			values['baseapp']=vars.fieldinfos[$('select#basefield',rowrelations).val()].lookup.relatedApp.app;
			values['baseappfield']=vars.fieldinfos[$('select#basefield',rowrelations).val()].lookup.relatedKeyField;
			values['istable']=(tablecode.length!=0)?'1':'0';
			values['relations']=[];
			for (var i2=0;i2<vars.fieldtable[i].rows.length;i2++)
			{
				rowfields=vars.fieldtable[i].rows.eq(i2);
				if ($('select#relationfield',rowfields).val()=='')
				{
					swal('Error!','表示フィールドを選択して下さい。','error');
					error=true;
					return;
				}
				if ($('select#basefield',rowrelations).val()==$('select#relationfield',rowfields).val())
				{
					swal('Error!','基準フィールドと表示フィールドは異なるフィールドを選択して下さい。','error');
					error=true;
					return;
				}
				if (vars.fieldinfos[$('select#relationfield',rowfields).val()].tablecode!=tablecode)
				{
					swal('Error!','テーブル内フィールドの指定は同一テーブルにして下さい。','error');
					error=true;
					return;
				}
				if ($('select#relationapp',rowfields).val()=='')
				{
					swal('Error!','関連付けるアプリとコピー元のフィールドを選択して下さい。','error');
					error=true;
					return;
				}
				if ($('select#relationappfield',rowfields).val()=='')
				{
					swal('Error!','関連付けるアプリとコピー元のフィールドを選択して下さい。','error');
					error=true;
					return;
				}
				if ($('select#basecode',rowfields).val()=='')
				{
					swal('Error!','フィールドの関連付けを選択して下さい。','error');
					error=true;
					return;
				}
				if ($('select#relationcode',rowfields).val()=='')
				{
					swal('Error!','フィールドの関連付けを選択して下さい。','error');
					error=true;
					return;
				}
				if ($('select#basefield',rowrelations).val()==$('select#relationfield',rowfields).val())
				{
					swal('Error!','基準フィールドと表示フィールドは異なるフィールドを選択して下さい。','error');
					error=true;
					return;
				}
				values['relations'].push({
					relationfield:$('select#relationfield',rowfields).val(),
					relationapp:$('select#relationapp',rowfields).val(),
					relationappfield:$('select#relationappfield',rowfields).val(),
					basecode:$('select#basecode',rowfields).val(),
					relationcode:$('select#relationcode',rowfields).val(),
					lookup:(vars.fieldinfos[$('select#relationfield',rowfields).val()].lookup)?'1':'0',
					rewrite:($('input#rewrite',rowfields).prop('checked'))?'1':'0'
				});
			}
			relations.push(values);
			if (error) return;
		}
		if (error) return;
		/* setup config */
		config['relations']=JSON.stringify(relations,'');
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);