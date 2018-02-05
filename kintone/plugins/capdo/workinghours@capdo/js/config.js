/*
*--------------------------------------------------------------------
* jQuery-Plugin "workinghours -config.js-"
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
	var VIEW_NAME=['作業時間計測'];
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
						case 'CREATOR':
							$('select#worker').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'DATE':
							$('select#date').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'MULTI_LINE_TEXT':
							$('select#memo').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'NUMBER':
						case 'SINGLE_LINE_TEXT':
							if (fieldinfo.lookup)
							{
								$('select#client').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#segment').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
							break;
						case 'TIME':
							$('select#starttime').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#endtime').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
					}
				}
			});
			if (Object.keys(config).length!==0)
			{
				$('select#date').val(config['date']);
				$('select#starttime').val(config['starttime']);
				$('select#endtime').val(config['endtime']);
				$('select#worker').val(config['worker']);
				$('select#client').val(config['client']);
				$('select#segment').val(config['segment']);
				$('select#memo').val(config['memo']);
				$('input#license').val(config['license']);
			}
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var key='';
		var row=null;
		var config=[];
		var employeecolors=[];
		/* check values */
		if ($('select#date').val()=='')
		{
			swal('Error!','作業日フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#starttime').val()=='')
		{
			swal('Error!','作業開始時刻フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#endtime').val()=='')
		{
			swal('Error!','作業終了時刻フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#starttime').val()==$('select#endtime').val())
		{
			swal('Error!','作業開始時刻フィールドと作業終了時刻フィールドは異なるフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#worker').val()=='')
		{
			swal('Error!','作業者フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#client').val()=='')
		{
			swal('Error!','顧客フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#segment').val()=='')
		{
			swal('Error!','作業区分フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#memo').val()=='')
		{
			swal('Error!','メモフィールドを選択して下さい。','error');
			return;
		}
		if ($('input#license').val().length==0)
		{
			swal('Error!','ライセンス認証URLを入力して下さい。','error');
			return;
		}
		/* setup config */
		config['date']=$('select#date').val();
		config['starttime']=$('select#starttime').val();
		config['endtime']=$('select#endtime').val();
		config['worker']=$('select#worker').val();
		config['client']=$('select#client').val();
		config['segment']=$('select#segment').val();
		config['memo']=$('select#memo').val();
		config['license']=$('input#license').val();
		/* get view lists */
		kintone.api(kintone.api.url('/k/v1/preview/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
			var req=$.extend(true,{},resp);
			req.app=kintone.app.getId();
			$.each(VIEW_NAME,function(index){
				if (!req.views[VIEW_NAME[index]])
				{
					/* swaps the index */
					$.each(req.views,function(key,values){
						if ($.inArray(key,VIEW_NAME)<0) values.index=Number(values.index)+1;
					})
		   			/* create custom view */
					req.views[VIEW_NAME[index]]={
						type:'CUSTOM',
						name:VIEW_NAME[index],
						html:'<div id="workinghours-container" class="customview-container"></div>',
						filterCond:'',
						sort:'',
						pager:false,
						index:index
					};
				}
			});
			/* save viewid */
			kintone.api(kintone.api.url('/k/v1/preview/app/views',true),'PUT',req,function(resp){
				/* setup config */
				config['workinghours']=resp.views[VIEW_NAME[0]].id;
				/* save config */
				kintone.plugin.app.setConfig(config);
			},function(error){});
		},function(error){});
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);