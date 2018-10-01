/*
*--------------------------------------------------------------------
* jQuery-Plugin "chatworkroom -config.js-"
* Version: 3.0
* Copyright (c) 2018 TIS
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
							if (!values.elementId) codes.push(values.code);
							else $('select#spacer').append($('<option>').attr('value',values.elementId).text(values.elementId));
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
						case 'SINGLE_LINE_TEXT':
							$('select#room_id').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#room_name').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
					}
				}
			});
			/* initialize valiable */
			if (Object.keys(config).length!==0)
			{
				$('select#room_id').val(config['room_id']);
				$('select#room_name').val(config['room_name']);
				$('select#spacer').val(config['spacer']);
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
		if ($('select#room_id').val()=='')
		{
			swal('Error!','ルームIDフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#spacer').val()=='')
		{
			swal('Error!','履歴表示スペースを選択して下さい。','error');
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
		config['room_id']=$('select#room_id').val();
		config['room_name']=$('select#room_name').val();
		config['spacer']=$('select#spacer').val();
		config['client_id']=$('input#client_id').val();
		config['client_secret']=$('input#client_secret').val();
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);