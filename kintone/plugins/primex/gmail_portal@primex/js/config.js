/*
*--------------------------------------------------------------------
* jQuery-Plugin "gmail -config.js-"
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
		offset:0,
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
					if (values.appId!=kintone.app.getId()) $('select#mailtoapp').append($('<option>').attr('value',values.appId).text(values.name));
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
			var target=$('select#mailtoapp');
			if (target.val())
			{
				kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:target.val()},function(resp){
					var sorted=functions.fieldsort(resp.layout);
					/* get fieldinfo */
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:target.val()},function(resp){
						$.each(sorted,function(index){
							if (sorted[index] in resp.properties)
							{
								var fieldinfo=resp.properties[sorted[index]];
								/* check field type */
								switch (fieldinfo.type)
								{
									case 'RADIO_BUTTON':
										$('select#mailtomedia').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										$('select#mailtosegment').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										$('select#mailtoarea').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										break;
									case 'LINK':
										$('select#mailtoaddress').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										break;
									case 'SINGLE_LINE_TEXT':
										$('select#mailtoname').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										$('select#mailtoaddress').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										break;
								}
							}
						});
						if (callback!=null) callback();
					},function(error){});
				},function(error){});
			}
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
			vars.fieldinfos=$.fieldparallelize(resp.properties);
			$.each(sorted,function(index){
				if (sorted[index] in vars.fieldinfos)
				{
					var fieldinfo=vars.fieldinfos[sorted[index]];
					/* check field type */
					switch (fieldinfo.type)
					{
						case 'DATE':
							if (fieldinfo.tablecode)
							{
								$('select#datefrom').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#dateto').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
							break;
						case 'FILE':
							if (!fieldinfo.tablecode) $('select#attachment').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'MULTI_LINE_TEXT':
							if (!fieldinfo.tablecode) $('select#revisionbody').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'NUMBER':
							if (fieldinfo.tablecode) $('select#price').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'SINGLE_LINE_TEXT':
							if (fieldinfo.tablecode)
							{
								$('select#orderno').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#media').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#menu').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
							else
							{
								$('select#customer').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#subject').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
							break;
						case 'USER_SELECT':
							if (!fieldinfo.tablecode) $('select#charger').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
					}
				}
			});
			/* initialize valiable */
			functions.loadapps(function(){
				/* setup config */
				if (Object.keys(config).length!==0)
				{
					$('select#mailtoapp').val(config['mailtoapp']);
					$('select#customer').val(config['customer']);
					$('select#subject').val(config['subject']);
					$('select#charger').val(config['charger']);
					$('select#orderno').val(config['orderno']);
					$('select#media').val(config['media']);
					$('select#menu').val(config['menu']);
					$('select#datefrom').val(config['datefrom']);
					$('select#dateto').val(config['dateto']);
					$('select#price').val(config['price']);
					$('select#attachment').val(config['attachment']);
					$('select#revisionbody').val(config['revisionbody']);
					$('input#client_id').val(config['client_id']);
					if (config['draft']=='1') $('input#draft').prop('checked',true);
					functions.reloadapp(function(){
						$('select#mailtomedia').val(config['mailtomedia']);
						$('select#mailtosegment').val(config['mailtosegment']);
						$('select#mailtoarea').val(config['mailtoarea']);
						$('select#mailtoname').val(config['mailtoname']);
						$('select#mailtoaddress').val(config['mailtoaddress']);
					});
				}
				else functions.reloadapp();
				/* events */
				$('select#mailtoapp').on('change',function(){functions.reloadapp()});
			});
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var config=[];
		/* check values */
		if ($('select#mailtoapp').val()=='')
		{
			swal('Error!','宛先アプリを選択して下さい。','error');
			return;
		}
		if ($('select#mailtomedia').val()=='')
		{
			swal('Error!','宛先アプリ媒体フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#mailtosegment').val()=='')
		{
			swal('Error!','宛先アプリ区分フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#mailtoarea').val()=='')
		{
			swal('Error!','宛先アプリエリアフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#mailtoname').val()=='')
		{
			swal('Error!','宛先アプリ宛先フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#mailtoaddress').val()=='')
		{
			swal('Error!','宛先アプリメールアドレスフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#customer').val()=='')
		{
			swal('Error!','広告主フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#subject').val()=='')
		{
			swal('Error!','案件名フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#charger').val()=='')
		{
			swal('Error!','営業担当者フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#orderno').val()=='')
		{
			swal('Error!','注文番号フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#media').val()=='')
		{
			swal('Error!','媒体名フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#menu').val()=='')
		{
			swal('Error!','メニューフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#datefrom').val()=='')
		{
			swal('Error!','期間(開始)フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#dateto').val()=='')
		{
			swal('Error!','期間(終了)フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#price').val()=='')
		{
			swal('Error!','申込金額フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#attachment').val()=='')
		{
			swal('Error!','添付ファイルフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#revisionbody').val()=='')
		{
			swal('Error!','訂正本文フィールドを選択して下さい。','error');
			return;
		}
		if ($('input#client_id').val()=='')
		{
			swal('Error!','Google OAuth クライアントIDを入力して下さい。','error');
			return;
		}
		/* setup config */
		config['mailtoapp']=$('select#mailtoapp').val();
		config['mailtomedia']=$('select#mailtomedia').val();
		config['mailtosegment']=$('select#mailtosegment').val();
		config['mailtoarea']=$('select#mailtoarea').val();
		config['mailtoname']=$('select#mailtoname').val();
		config['mailtoaddress']=$('select#mailtoaddress').val();
		config['customer']=$('select#customer').val();
		config['subject']=$('select#subject').val();
		config['charger']=$('select#charger').val();
		config['orderno']=$('select#orderno').val();
		config['media']=$('select#media').val();
		config['menu']=$('select#menu').val();
		config['datefrom']=$('select#datefrom').val();
		config['dateto']=$('select#dateto').val();
		config['price']=$('select#price').val();
		config['attachment']=$('select#attachment').val();
		config['revisionbody']=$('select#revisionbody').val();
		config['client_id']=$('input#client_id').val();
		config['draft']=($('input#draft').prop('checked'))?'1':'0';
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);