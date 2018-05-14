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
			$('select#statusdenyvalue').empty();
			$('select#statusallocatevalue').empty();
			$('select#statusdonevalue').empty();
			$('select#statusdenyvalue').append($('<option>').attr('value','').text(''));
			$('select#statusallocatevalue').append($('<option>').attr('value','').text(''));
			$('select#statusdonevalue').append($('<option>').attr('value','').text(''));
			if (target.val().length!=0)
			{
				var fieldinfo=vars.fieldinfos[target.val()];
				var options=[fieldinfo.options.length];
				$.each(fieldinfo.options,function(key,values){
					options[values.index]=values.label;
				});
				for (var i=0;i<options.length;i++)
				{
					$('select#statusdenyvalue').append($('<option>').attr('value',options[i]).text(options[i]));
					$('select#statusallocatevalue').append($('<option>').attr('value',options[i]).text(options[i]));
					$('select#statusdonevalue').append($('<option>').attr('value',options[i]).text(options[i]));
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
			$('select#allocationview').append($('<option>').attr('value',values.id).text(key));
			$('select#requestview').append($('<option>').attr('value',values.id).text(key));
		});
		$.loadorganizations(function(records){
			records.sort(function(a,b){
				if(parseInt(a.id)<parseInt(b.id)) return -1;
				if(parseInt(a.id)>parseInt(b.id)) return 1;
				return 0;
			});
			$.each(records,function(index,values){
				$('select#organization').append($('<option>').attr('value',values.code).text(values.name));
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
								case 'LINK':
									if (fieldinfo.protocol.toUpperCase()=='CALL')
										$('select#tel').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
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
										$('select#tel').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
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
					var allocationcolors=[];
					var requestcolors=[];
					if (Object.keys(config).length!==0)
					{
						allocationcolors=JSON.parse(config['allocationcolors']);
						requestcolors=JSON.parse(config['requestcolors']);
						$('select#allocationview').val(config['allocationview']);
						$('select#requestview').val(config['requestview']);
						$('select#address').val(config['address']);
						$('select#lat').val(config['lat']);
						$('select#lng').val(config['lng']);
						$('select#driver').val(config['driver']);
						$('select#organization').val(config['organization']);
						$('select#date').val(config['date']);
						$('select#starttime').val(config['starttime']);
						$('select#endtime').val(config['endtime']);
						$('select#owner').val(config['owner']);
						$('select#tel').val(config['tel']);
						$('select#transportation').val(config['transportation']);
						$('select#destination').val(config['destination']);
						$('select#car').val(config['car']);
						$('select#carownmove').val(config['carownmove']);
						$('select#carcondition').val(config['carcondition']);
						$('select#status').val(config['status']);
						$('select#spacer').val(config['spacer']);
						if ('statusallocatecolor' in config) $('input#statusallocatecolor').val(config['statusallocatecolor']);
						else $('input#statusallocatecolor').val(vars.colors[0].replace('#',''));
						if ('statusdonecolor' in config) $('input#statusdonecolor').val(config['statusdonecolor']);
						else $('input#statusdonecolor').val(vars.colors[0].replace('#',''));
						$('input#apikey').val(config['apikey']);
						$.each($('.allocationcolors').find('tbody').find('tr'),function(index){
							var row=$(this);
							$('input#allocationcolor',row).val(allocationcolors[index]);
						});
						$.each($('.requestcolors').find('tbody').find('tr'),function(index){
							var row=$(this);
							$('input#requestcolor',row).val(requestcolors[index]);
						});
						functions.reloadstatus(function(){
							$('select#statusdenyvalue').val(config['statusdenyvalue']);
							$('select#statusallocatevalue').val(config['statusallocatevalue']);
							$('select#statusdonevalue').val(config['statusdonevalue']);
						});
					}
					else
					{
						$('input#statusallocatecolor').val(vars.colors[0].replace('#',''));
						$('input#statusdonecolor').val(vars.colors[0].replace('#',''));
						$.each($('input#allocationcolor'),function(){$(this).val(vars.colors[0].replace('#',''))});
						$.each($('input#requestcolor'),function(){$(this).val(vars.colors[0].replace('#',''))});
					}
					$('select#status').on('change',function(){functions.reloadstatus()});
					$('span#statusallocatecolor').colorSelector(vars.colors,$('input#statusallocatecolor'));
					$('span#statusdonecolor').colorSelector(vars.colors,$('input#statusdonecolor'));
					$.each($('span#allocationcolor'),function(index){
						$(this).colorSelector(vars.colors,$(this).closest('tr').find('input#allocationcolor'));
					});
					$.each($('span#requestcolor'),function(index){
						$(this).colorSelector(vars.colors,$(this).closest('tr').find('input#requestcolor'));
					});
				});
			},function(error){});
		});
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var error=false;
		var row=null;
		var config=[];
		var allocationcolors=[];
		var requestcolors=[];
		/* check values */
		if ($('select#allocationview').val()=='')
		{
			swal('Error!','引取指示使用一覧を選択して下さい。','error');
			return;
		}
		if ($('select#requestview').val()=='')
		{
			swal('Error!','引取依頼確認使用一覧を選択して下さい。','error');
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
		if ($('select#organization').val()=='')
		{
			swal('Error!','担当者絞り込み組織を選択して下さい。','error');
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
		if ($('select#tel').val()=='')
		{
			swal('Error!','電話番号フィールドを選択して下さい。','error');
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
		if ($('select#statusdenyvalue').val()=='')
		{
			swal('Error!','未引取選択値を選択して下さい。','error');
			return;
		}
		if ($('select#statusallocatevalue').val()=='')
		{
			swal('Error!','引取指示選択値を選択して下さい。','error');
			return;
		}
		if ($('input#statusallocatecolor').val()=='')
		{
			swal('Error!','引取指示選択色を選択して下さい。','error');
			error=true;
		}
		if ($('select#statusdonevalue').val()=='')
		{
			swal('Error!','引取中選択値を選択して下さい。','error');
			return;
		}
		if ($('input#statusdonecolor').val()=='')
		{
			swal('Error!','引取中選択色を選択して下さい。','error');
			error=true;
		}
		if ($('select#spacer').val()=='')
		{
			swal('Error!','地図表示フィールドを選択して下さい。','error');
			return;
		}
		$.each($('.allocationcolors').find('tbody').find('tr'),function(index){
			var row=$(this);
			if ($('input#allocationcolor',row).val()=='')
			{
				swal('Error!','引取指示用マーカー色を選択して下さい。','error');
				error=true;
			}
			allocationcolors.push($('input#allocationcolor',row).val());
		})
		$.each($('.requestcolors').find('tbody').find('tr'),function(index){
			var row=$(this);
			if ($('input#requestcolor',row).val()=='')
			{
				swal('Error!','引取依頼確認用マーカー色を選択して下さい。','error');
				error=true;
			}
			requestcolors.push($('input#requestcolor',row).val());
		})
		if (error) return;
		/* setup config */
		config['allocationview']=$('select#allocationview').val();
		config['requestview']=$('select#requestview').val();
		config['address']=$('select#address').val();
		config['lat']=$('select#lat').val();
		config['lng']=$('select#lng').val();
		config['driver']=$('select#driver').val();
		config['organization']=$('select#organization').val();
		config['date']=$('select#date').val();
		config['starttime']=$('select#starttime').val();
		config['endtime']=$('select#endtime').val();
		config['owner']=$('select#owner').val();
		config['tel']=$('select#tel').val();
		config['transportation']=$('select#transportation').val();
		config['destination']=$('select#destination').val();
		config['car']=$('select#car').val();
		config['carownmove']=$('select#carownmove').val();
		config['carcondition']=$('select#carcondition').val();
		config['status']=$('select#status').val();
		config['statusdenyvalue']=$('select#statusdenyvalue').val();
		config['statusallocatevalue']=$('select#statusallocatevalue').val();
		config['statusallocatecolor']=$('input#statusallocatecolor').val();
		config['statusdonevalue']=$('select#statusdonevalue').val();
		config['statusdonecolor']=$('input#statusdonecolor').val();
		config['spacer']=$('select#spacer').val();
		config['apikey']=$('input#apikey').val();
		config['allocationcolors']=JSON.stringify(allocationcolors);
		config['requestcolors']=JSON.stringify(requestcolors);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);