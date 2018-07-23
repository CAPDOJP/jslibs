/*
*--------------------------------------------------------------------
* jQuery-Plugin "chatworktask -config.js-"
* Version: 3.0
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
		fieldinfos:{}
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
				}
			});
			return codes;
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
		var sorted=functions.fieldsort(resp.layout);
		/* get fieldinfo */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			var config=kintone.plugin.app.getConfig(PLUGIN_ID);
			vars.fieldinfos=resp.properties;
			$.each(sorted,function(index){
				if (sorted[index] in vars.fieldinfos)
				{
					var fieldinfo=vars.fieldinfos[sorted[index]];
					/* check field type */
					switch (fieldinfo.type)
					{
						case 'DATE':
							$('select#limit').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'MULTI_LINE_TEXT':
							$('select#task').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'SINGLE_LINE_TEXT':
							$('select#taskid').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#roomid').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#roomname').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#member').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#task').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#status').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
					}
				}
			});
			/* initialize valiable */
			if (Object.keys(config).length!==0)
			{
				$('select#taskid').val(config['taskid']);
				$('select#roomid').val(config['roomid']);
				$('select#roomname').val(config['roomname']);
				$('select#member').val(config['member']);
				$('select#limit').val(config['limit']);
				$('select#task').val(config['task']);
				$('select#status').val(config['status']);
				$('input#client_id').val(config['client_id']);
				$('input#client_secret').val(config['client_secret']);
			}
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var config=[];
		/* check values */
		if ($('select#taskid').val()=='')
		{
			swal('Error!','タスクIDフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#roomid').val()=='')
		{
			swal('Error!','チャットルームIDフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#roomname').val()=='')
		{
			swal('Error!','チャットルーム名フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#member').val()=='')
		{
			swal('Error!','タスク担当メンバーフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#limit').val()=='')
		{
			swal('Error!','タスク期限フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#task').val()=='')
		{
			swal('Error!','タスク内容フィールドを選択して下さい。','error');
			return;
		}
		if ($('input#client_id').val()=='')
		{
			swal('Error!','クライアントIDを入力して下さい。','error');
			return;
		}
		if ($('input#client_secret').val()=='')
		{
			swal('Error!','クライアントシークレットを入力して下さい。','error');
			return;
		}
		/* setup config */
		config['taskid']=$('select#taskid').val();
		config['roomid']=$('select#roomid').val();
		config['roomname']=$('select#roomname').val();
		config['member']=$('select#member').val();
		config['limit']=$('select#limit').val();
		config['task']=$('select#task').val();
		config['status']=$('select#status').val();
		config['client_id']=$('input#client_id').val();
		config['client_secret']=$('input#client_secret').val();
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);