/*
*--------------------------------------------------------------------
* jQuery-Plugin "allocation -config.js-"
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
		colors:[],
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
							else $('select#spacer').append($('<option>').attr('value',values.elementId).text(values.elementId));
						});
						break;
					case 'GROUP':
						$.merge(codes,functions.fieldsort(values.layout));
						break;
				}
			});
			return codes;
		},
		reloadstatus:function(callback){
			/* clear rows */
			var target=$('select#status');
			$('select#statusvalue').empty();
			$('select#statusdenyvalue').empty();
			$('select#statusvalue').append($('<option>').attr('value','').text(''));
			$('select#statusdenyvalue').append($('<option>').attr('value','').text(''));
			if (target.val().length!=0)
			{
				var fieldinfo=vars.fieldinfos[target.val()];
				var options=[fieldinfo.options.length];
				$.each(fieldinfo.options,function(key,values){
					options[values.index]=values.label;
				});
				for (var i=0;i<options.length;i++)
				{
					$('select#statusvalue').append($('<option>').attr('value',options[i]).text(options[i]));
					$('select#statusdenyvalue').append($('<option>').attr('value',options[i]).text(options[i]));
				}
			}
			if (callback) callback();
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
		$.each(resp.views,function(key,values){
			$('select#targetview').append($('<option>').attr('value',values.id).text(key));
		});
		kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
			var sorted=functions.fieldsort(resp.layout);
			/* get fieldinfo */
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				var config=kintone.plugin.app.getConfig(PLUGIN_ID);
				vars.fieldinfos=$.fieldparallelize(resp.properties);
				/* setup colorfields lists */
				vars.colors=[];
				$.each($.markercolors(),function(index,values){vars.colors.push('#'+values.back);});
				/* initialize valiable */
				$.each(sorted,function(index){
					if (sorted[index] in vars.fieldinfos)
					{
						var fieldinfo=vars.fieldinfos[sorted[index]];
						/* check field type */
						switch (fieldinfo.type)
						{
							case 'DATE':
								$('select#date').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								break;
							case 'DROP_DOWN':
							case 'RADIO_BUTTON':
								$('select#transportation').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#destination').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#carownmove').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#status').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								break;
							case 'NUMBER':
								/* exclude lookup */
								if (!fieldinfo.lookup)
								{
									/* check scale */
									if (fieldinfo.displayScale)
										if (fieldinfo.displayScale>8)
										{
											$('select#lat').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
											$('select#lng').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										}
								}
								break;
							case 'SINGLE_LINE_TEXT':
								/* exclude lookup */
								if (!fieldinfo.lookup)
								{
									$('select#address').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
									$('select#owner').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
									$('select#carcondition').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								}
								else $('select#car').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								break;
							case 'TIME':
								$('select#starttime').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#endtime').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								break;
							case 'USER_SELECT':
								$('select#driver').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								break;
						}
					}
				});
				/* initialize valiable */
				var markercolors=[];
				if (Object.keys(config).length!==0)
				{
					markercolors=JSON.parse(config['markercolors']);
					$('select#targetview').val(config['targetview']);
					$('select#address').val(config['address']);
					$('select#lat').val(config['lat']);
					$('select#lng').val(config['lng']);
					$('select#driver').val(config['driver']);
					$('select#date').val(config['date']);
					$('select#starttime').val(config['starttime']);
					$('select#endtime').val(config['endtime']);
					$('select#owner').val(config['owner']);
					$('select#transportation').val(config['transportation']);
					$('select#destination').val(config['destination']);
					$('select#car').val(config['car']);
					$('select#carownmove').val(config['carownmove']);
					$('select#carcondition').val(config['carcondition']);
					$('select#status').val(config['status']);
					$('select#spacer').val(config['spacer']);
					$('input#apikey').val(config['apikey']);
					$.each($('.markercolors').find('tbody').find('tr'),function(index){
						var row=$(this);
						$('input#markercolor',row).val(markercolors[index]);
					});
					functions.reloadstatus(function(){
						$('select#statusvalue').val(config['statusvalue']);
						$('select#statusdenyvalue').val(config['statusdenyvalue']);
					});
				}
				else $.each($('input#markercolor'),function(){$(this).val(vars.colors[0].replace('#',''))});
				$('select#status').on('change',function(){functions.reloadstatus()});
				$.each($('span#markercolor'),function(index){
					$(this).colorSelector(vars.colors,$(this).closest('tr').find('input#markercolor'));
				});
			});
		},function(error){});
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var error=false;
		var row=null;
		var config=[];
		var markercolors=[];
		/* check values */
		if ($('select#targetview').val()=='')
		{
			swal('Error!','使用一覧を選択して下さい。','error');
			return;
		}
		if ($('select#address').val()=='')
		{
			swal('Error!','引取先住所入力フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#lat').val()=='')
		{
			swal('Error!','緯度表示フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#lng').val()=='')
		{
			swal('Error!','経度表示フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#driver').val()=='')
		{
			swal('Error!','担当者フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#date').val()=='')
		{
			swal('Error!','引取予定日フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#starttime').val()=='')
		{
			swal('Error!','引取開始時刻フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#endtime').val()=='')
		{
			swal('Error!','引取終了時刻フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#owner').val()=='')
		{
			swal('Error!','依頼元フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#transportation').val()=='')
		{
			swal('Error!','トラックフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#destination').val()=='')
		{
			swal('Error!','搬入先フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#car').val()=='')
		{
			swal('Error!','引取車種フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#carownmove').val()=='')
		{
			swal('Error!','自走区分フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#carcondition').val()=='')
		{
			swal('Error!','車輌状態フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#status').val()=='')
		{
			swal('Error!','車輌ステータスフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#statusvalue').val()=='')
		{
			swal('Error!','引取指示選択値を選択して下さい。','error');
			return;
		}
		if ($('select#statusdenyvalue').val()=='')
		{
			swal('Error!','未引取選択値を選択して下さい。','error');
			return;
		}
		if ($('select#spacer').val()=='')
		{
			swal('Error!','地図表示フィールドを選択して下さい。','error');
			return;
		}
		$.each($('.markercolors').find('tbody').find('tr'),function(index){
			var row=$(this);
			if ($('input#markercolor',row).val()=='')
			{
				swal('Error!','マーカー色を選択して下さい。','error');
				error=true;
			}
			markercolors.push($('input#markercolor',row).val());
		})
		if (error) return;
		/* setup config */
		config['targetview']=$('select#targetview').val();
		config['address']=$('select#address').val();
		config['lat']=$('select#lat').val();
		config['lng']=$('select#lng').val();
		config['driver']=$('select#driver').val();
		config['date']=$('select#date').val();
		config['starttime']=$('select#starttime').val();
		config['endtime']=$('select#endtime').val();
		config['owner']=$('select#owner').val();
		config['transportation']=$('select#transportation').val();
		config['destination']=$('select#destination').val();
		config['car']=$('select#car').val();
		config['carownmove']=$('select#carownmove').val();
		config['carcondition']=$('select#carcondition').val();
		config['status']=$('select#status').val();
		config['statusvalue']=$('select#statusvalue').val();
		config['statusdenyvalue']=$('select#statusdenyvalue').val();
		config['spacer']=$('select#spacer').val();
		config['apikey']=$('input#apikey').val();
		config['markercolors']=JSON.stringify(markercolors);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);