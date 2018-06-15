/*
*--------------------------------------------------------------------
* jQuery-Plugin "hotelmanagement -config.js-"
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
	var VIEW_NAME=['月次宿泊予定表','客室稼働状況一覧','食事提供一覧'];
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
		reloadmealplaces:function(callback){
			var target=$('select#mealplace');
			/* initinalize elements */
			$('select#mealplacename').empty().append($('<option>').attr('value','').text(''));
			if (target.val().length!=0)
			{
				kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:vars.fieldinfos[target.val()].lookup.relatedApp.app},function(resp){
					var sorted=functions.fieldsort(resp.layout);
					/* get fieldinfo */
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:vars.fieldinfos[target.val()].lookup.relatedApp.app},function(resp){
						$.each(sorted,function(index){
							if (sorted[index] in resp.properties)
							{
								var fieldinfo=resp.properties[sorted[index]];
								/* check field type */
								switch (fieldinfo.type)
								{
									case 'SINGLE_LINE_TEXT':
										$('select#mealplacename').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								}
							}
						});
						if (callback) callback();
					},function(error){});
				},function(error){});
			}
		},
		reloadrooms:function(callback){
			var target=$('select#room');
			/* initinalize elements */
			$('select#roomname').empty().append($('<option>').attr('value','').text(''));
			if (target.val().length!=0)
			{
				kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:vars.fieldinfos[target.val()].lookup.relatedApp.app},function(resp){
					var sorted=functions.fieldsort(resp.layout);
					/* get fieldinfo */
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:vars.fieldinfos[target.val()].lookup.relatedApp.app},function(resp){
						$.each(sorted,function(index){
							if (sorted[index] in resp.properties)
							{
								var fieldinfo=resp.properties[sorted[index]];
								/* check field type */
								switch (fieldinfo.type)
								{
									case 'SINGLE_LINE_TEXT':
										$('select#roomname').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								}
							}
						});
						if (callback) callback();
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
								$('select#mealdate').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
						case 'DATETIME':
							$('select#fromtime').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#totime').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'NUMBER':
							if (fieldinfo.tablecode)
								if (fieldinfo.lookup)
								{
									$('select#room').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
									$('select#mealplace').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								}
						case 'SINGLE_LINE_TEXT':
							$('select#visitor').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							if (fieldinfo.tablecode)
								if (fieldinfo.lookup)
								{
									$('select#room').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
									$('select#mealplace').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								}
						case 'TIME':
							if (fieldinfo.tablecode)
							{
								$('select#mealstarttime').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#mealendtime').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
					}
				}
			});
			if (Object.keys(config).length!==0)
			{
				$('select#fromtime').val(config['fromtime']);
				$('select#totime').val(config['totime']);
				$('select#visitor').val(config['visitor']);
				$('select#room').val(config['room']);
				$('select#mealdate').val(config['mealdate']);
				$('select#mealstarttime').val(config['mealstarttime']);
				$('select#mealendtime').val(config['mealendtime']);
				$('select#mealplace').val(config['mealplace']);
				$('select#starthour').val(config['starthour']);
				$('select#endhour').val(config['endhour']);
				$('select#scale').val(config['scale']);
				$('input#scalefixedwidth').val(config['scalefixedwidth']);
				$('input#license').val(config['license']);
				if (config['scalefixed']=='1') $('input#scalefixed').prop('checked',true);
				functions.reloadrooms(function(){
					$('select#roomname').val(config['roomname']);
				});
				functions.reloadmealplaces(function(){
					$('select#mealplacename').val(config['mealplacename']);
				});
			}
			$('select#room').on('change',function(){functions.reloadrooms();});
			$('select#mealplace').on('change',function(){functions.reloadmealplaces();});
		});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
        var config=[];
	    /* check values */
	    if ($('select#fromtime').val()=='')
	    {
	    	swal('Error!','チェックイン日時フィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#totime').val()=='')
	    {
	    	swal('Error!','チェックアウト日時フィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#fromtime').val()==$('select#totime').val())
	    {
	    	swal('Error!','開始日時フィールドと終了日時フィールドは異なるフィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#visitor').val()=='')
	    {
	    	swal('Error!','宿泊代表名フィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#room').val()=='')
	    {
	    	swal('Error!','宿泊部屋フィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#roomname').val()=='')
	    {
	    	swal('Error!','宿泊部屋名フィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#mealdate').val()=='')
	    {
	    	swal('Error!','食事日付フィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#mealstarttime').val()=='')
	    {
	    	swal('Error!','食事開始時刻フィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#mealendtime').val()=='')
	    {
	    	swal('Error!','食事終了時刻フィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#mealplace').val()=='')
	    {
	    	swal('Error!','食事会場フィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#mealplacename').val()=='')
	    {
	    	swal('Error!','食事会場名フィールドを選択して下さい。','error');
	    	return;
	    }
		if (vars.fieldinfos[$('select#mealdate').val()].tablecode!=vars.fieldinfos[$('select#mealstarttime').val()].tablecode)
		{
			swal('Error!','テーブル内フィールドの指定は同一テーブルにして下さい。','error');
			return;
		}
		if (vars.fieldinfos[$('select#mealdate').val()].tablecode!=vars.fieldinfos[$('select#mealendtime').val()].tablecode)
		{
			swal('Error!','テーブル内フィールドの指定は同一テーブルにして下さい。','error');
			return;
		}
		if (vars.fieldinfos[$('select#mealdate').val()].tablecode!=vars.fieldinfos[$('select#mealplace').val()].tablecode)
		{
			swal('Error!','テーブル内フィールドの指定は同一テーブルにして下さい。','error');
			return;
		}
		if ($('select#starthour').val()=='')
		{
			swal('Error!','食事提供開始時刻を選択して下さい。','error');
			return;
		}
		if ($('select#endhour').val()=='')
		{
			swal('Error!','食事提供終了時刻を選択して下さい。','error');
			return;
		}
	    if ($('select#scale').val()=='')
	    {
	    	swal('Error!','目盛り間隔を選択して下さい。','error');
	    	return;
	    }
	    if ($('input#scalefixed').prop('checked'))
	    {
		    if ($('input#scalefixedwidth').val()=='')
		    {
		    	swal('Error!','目盛幅を入力して下さい。','error');
		    	return;
		    }
			if (!$.isNumeric($('input#scalefixedwidth').val()))
		    {
		    	swal('Error!','目盛幅は数値を入力して下さい。','error');
		    	return;
		    }
	    }
		if ($('input#license').val().length==0)
		{
			swal('Error!','ライセンス認証URLを入力して下さい。','error');
			return;
		}
		/* setup config */
        config['fromtime']=$('select#fromtime').val();
        config['totime']=$('select#totime').val();
        config['visitor']=$('select#visitor').val();
        config['room']=$('select#room').val();
        config['roomname']=$('select#roomname').val();
        config['mealdate']=$('select#mealdate').val();
        config['mealstarttime']=$('select#mealstarttime').val();
        config['mealendtime']=$('select#mealendtime').val();
        config['mealplace']=$('select#mealplace').val();
        config['mealplacename']=$('select#mealplacename').val();
		config['starthour']=$('select#starthour').val();
		config['endhour']=$('select#endhour').val();
        config['scale']=$('select#scale').val();
        config['scalefixedwidth']=$('input#scalefixedwidth').val();
        config['scalefixed']=($('input#scalefixed').prop('checked'))?'1':'0';
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
						html:'<div id="hotelmanagement-container" class="customview-container"></div>',
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
		        config['monthlyschedule']=resp.views[VIEW_NAME[0]].id;
		        config['dailyschedule']=resp.views[VIEW_NAME[1]].id;
		        config['catering']=resp.views[VIEW_NAME[2]].id;
				/* save config */
				kintone.plugin.app.setConfig(config);
			},function(error){});
		},function(error){});
	});
    $('button#cancel').on('click',function(e){
        history.back();
    });
})(jQuery,kintone.$PLUGIN_ID);