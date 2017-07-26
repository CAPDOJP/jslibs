/*
*--------------------------------------------------------------------
* jQuery-Plugin "listcopy -config.js-"
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
		offset:0,
		rows:null,
		template:null,
		fieldinfos:{},
		viewinfos:{},
		appexcludes:[
			'CALC',
			'CATEGORY',
			'GROUP',
			'RECORD_NUMBER',
			'REFERENCE_TABLE',
			'STATUS',
			'STATUS_ASSIGNEE',
			'SUBTABLE'
		],
		keyexcludes:[
			'CATEGORY',
			'CHECK_BOX',
			'CREATED_TIME',
			'CREATOR',
			'DROP_DOWN',
			'FILE',
			'GROUP',
			'GROUP_SELECT',
			'MODIFIER',
			'MULTI_LINE_TEXT',
			'MULTI_SELECT',
			'ORGANIZATION_SELECT',
			'RADIO_BUTTON',
			'REFERENCE_TABLE',
			'RICH_TEXT',
			'STATUS',
			'STATUS_ASSIGNEE',
			'SUBTABLE',
			'TIME',
			'UPDATED_TIME',
			'USER_SELECT'
		],
		viewexcludes:[
			'CATEGORY',
			'REFERENCE_TABLE',
			'STATUS',
			'STATUS_ASSIGNEE',
			'SUBTABLE'
		]
	};
	var functions={
		loadapps:function(callback){
			kintone.api(kintone.api.url('/k/v1/apps',true),'GET',{offset:vars.offset},function(resp){
				/* setup app lists */
				$.each(resp.apps,function(index,values){
					if (values.appId!=kintone.app.getId()) $('select#copyapp').append($('<option>').attr('value',values.appId).text(values.name));
				})
				vars.offset+=100;
				if (resp.apps.length==100) functions.loadapps(callback);
				else
				{
					if (callback!=null) callback();
				}
			},function(error){});
		},
		reloadapp:function(callback){
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:$('select#copyapp').val()},function(resp){
				var mappings=[];
				/* append lookup exclude fields */
				$.each(resp.properties,function(key,values){
					if (values.lookup)
					{
						$.each(values.lookup.fieldMappings,function(index,values){
							if ($.inArray(values.field,mappings)<0) mappings.push(values.field);
						});
					}
				});
				/* initialize key fields elements */
				$('select#keyto').empty();
				$.each(resp.properties,function(key,values){
					if ($.inArray(values.type,vars.keyexcludes)<0) $('select#keyto').append($('<option>').attr('value',values.code).text(values.label));
				});
				/* initialize copy fields elements */
				for (var $i=0;$i<vars.rows.length;$i++)
				{
					$('select#copyto',vars.rows.eq($i)).empty();
					$('select#copyto',vars.rows.eq($i)).append($('<option>').attr('value','').text('コピーしない'));
					$.each(resp.properties,function(key,values){
						/* check exclude field */
						if ($.inArray(values.code,mappings)<0 && $.inArray(values.type,vars.appexcludes)<0)
							if ($.isvalidtype(vars.fieldinfos[$('input#copyfrom',vars.rows.eq($i)).val()],values))
								$('select#copyto',vars.rows.eq($i)).append($('<option>').attr('value',values.code).text(values.label));
					});
				};
				if (callback!=null) callback();
			});
		},
		reloadview:function(callback){
			var fields=vars.viewinfos[$('select#copyview').val()].fields;
			var row=null;
			/* initialize key fields elements */
			$('select#keyfrom').empty();
			$('select#keyfrom').append($('<option>').attr('value','').text('指定しない'));
			$.each(fields,function(index){
				if (fields[index] in vars.fieldinfos)
					if ((vars.fieldinfos[fields[index]].required && vars.fieldinfos[fields[index]].unique) || vars.fieldinfos[fields[index]].type=='RECORD_NUMBER')
						$('select#keyfrom').append($('<option>').attr('value',vars.fieldinfos[fields[index]].code).text(vars.fieldinfos[fields[index]].label));
			});
			functions.switchdisplay('')
			/* create copyfields rows */
			$('.copyfields').empty();
			$.each(fields,function(index){
				if (fields[index] in vars.fieldinfos)
				{
					row=vars.template.clone(true);
					row.find('input#copyfrom').val(vars.fieldinfos[fields[index]].code);
					row.find('span#copyfromname').text(vars.fieldinfos[fields[index]].label);
					$('.copyfields').append(row);
				}
			});
			vars.rows=$('.copyfields').find('tr');
			if (callback!=null) callback();
		},
		switchdisplay:function(value){
			if (value.length==0)
			{
				$('div.keyto').css({'display':'none'});
				$('span.keyto').css({'display':'inline-block'});
			}
			else
			{
				$('div.keyto').css({'display':'inline-block'});
				$('span.keyto').css({'display':'none'});
			}
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
		$.each(resp.properties,function(key,values){
			/* setup field informations */
			if ($.inArray(values.type,vars.viewexcludes)<0) vars.fieldinfos[values.code]=values;
		});
		kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
			var error=true;
			/* setup view lists */
			$('select#copyview').empty();
			$.each(resp.views,function(key,values){
				if (values.type.toUpperCase()=='LIST')
				{
					$('select#copyview').append($('<option>').attr('value',values.id).text(key));
					vars.viewinfos[values.id]=values;
					error=false;
				}
			});
			if (error)
			{
				swal('Error!','表形式の一覧が作成されていません。','error');
				return;
			}
			/* initialize valiable */
			vars.template=$('.copyfields').find('tr').first().clone(false);
			/* setup config */
			var config=kintone.plugin.app.getConfig(PLUGIN_ID);
			if (Object.keys(config).length!==0) $('select#copyview').val(config['copyview']);
			functions.reloadview();
			vars.offset=0;
			$('select#copyapp').empty();
			functions.loadapps(function(){
				/* setup config */
				if (Object.keys(config).length!==0)
				{
					$('select#copyapp').val(config['copyapp']);
					functions.reloadapp(function(){
						var copyfields=JSON.parse(config['copyfields']);
						for (var $i=0;$i<vars.rows.length;$i++) $('select#copyto',vars.rows.eq($i)).val(copyfields[$('input#copyfrom',vars.rows.eq($i)).val()]);
						$('select#keyfrom').val(config['keyfrom']);
						$('select#keyto').val(config['keyto']);
						functions.switchdisplay(config['keyto']);
					});
				}
				else functions.reloadapp();
				/* events */
				$('select#copyview').on('change',function(){functions.reloadview(function(){functions.reloadapp()})});
				$('select#copyapp').on('change',function(){functions.reloadapp()});
				$('select#keyfrom').on('change',function(){functions.switchdisplay($(this).val());});
			});
		});
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var config=[];
		var copyfields={};
		for (var $i=0;$i<vars.rows.length;$i++) copyfields[$('input#copyfrom',vars.rows.eq($i)).val()]=$('select#copyto',vars.rows.eq($i)).val();
		/* setup config */
		config['copyview']=$('select#copyview').val();
		config['copyapp']=$('select#copyapp').val();
		config['copyfields']=JSON.stringify(copyfields);
		config['keyfrom']=$('select#keyfrom').val();
		config['keyto']=$('select#keyto').val();
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);