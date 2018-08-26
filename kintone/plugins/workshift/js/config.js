/*
*--------------------------------------------------------------------
* jQuery-Plugin "workshift -config.js-"
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
		colortable:null,
		fieldinfos:{},
		colors:[
			'#FA8273',
			'#FFF07D',
			'#7DC87D',
			'#69B4C8',
			'#827DB9',
			'#E16EA5',
			'#FA7382',
			'#FFB46E',
			'#B4DC69',
			'#64C3AF',
			'#69A0C8',
			'#B473B4'
		]
	};
	var VIEW_NAME=['シフト表','打刻・勤務状況確認','出勤簿'];
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
						case 'NUMBER':
						case 'SINGLE_LINE_TEXT':
							if (fieldinfo.lookup) $('select#employee').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'DATETIME':
							$('select#shiftfromtime').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#shifttotime').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#workfromtime').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#worktotime').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'USER_SELECT':
							$('select#employee').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
					}
				}
			});
			/* initialize valiable */
			vars.colortable=$('.employeecolors').adjustabletable({
				add:'img.add',
				del:'img.del',
				addcallback:function(row){
					$('input#employeecolor',row).val(vars.colors[0].replace('#',''));
					$('span#employeecolor',row).colorSelector(vars.colors,$('input#employeecolor',row));
				}
			});
			$('select#employee',row).on('change',function(){
				var assignment={
					list:$('select#assignment'),
					sort:$('select#assignmentsort'),
					listcontainer:$('select#assignment').closest('.kintoneplugin-select-outer'),
					sortcontainer:$('select#assignmentsort').closest('.kintoneplugin-select-outer')
				};
				var employee={
					list:$('select#employeedisplay'),
					sort:$('select#employeesort'),
					listcontainer:$('select#employeedisplay').closest('.kintoneplugin-select-outer'),
					sortcontainer:$('select#employeesort').closest('.kintoneplugin-select-outer')
				};
				/* initialize field lists */
				assignment.listcontainer.hide();
				assignment.sortcontainer.hide();
				assignment.list.html('<option value=""></option>');
				employee.listcontainer.hide();
				employee.sortcontainer.hide();
				employee.list.html('<option value=""></option>');
				if ($(this).val().length!=0)
				{
					if (vars.fieldinfos[$(this).val()].lookup)
					{
						kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:vars.fieldinfos[$(this).val()].lookup.relatedApp.app},function(resp){
							/* setup field lists */
							$.each(resp.properties,function(key,values){
								switch (values.type)
								{
									case 'DROP_DOWN':
									case 'RADIO_BUTTON':
										if (!values.lookup) assignment.list.append($('<option>').attr('value',values.code).text(values.label));
										break;
									case 'SINGLE_LINE_TEXT':
										if (!values.lookup)
										{
											assignment.list.append($('<option>').attr('value',values.code).text(values.label));
											employee.list.append($('<option>').attr('value',values.code).text(values.label));
										}
								}
							});
							if ($.hasData(assignment.list[0]))
								if ($.data(assignment.list[0],'initialdata').length!=0)
								{
									assignment.list.val($.data(assignment.list[0],'initialdata'));
									$.data(assignment.list[0],'initialdata','');
								}
							assignment.listcontainer.show();
							assignment.sortcontainer.show();
							if ($.hasData(employee.list[0]))
								if ($.data(employee.list[0],'initialdata').length!=0)
								{
									employee.list.val($.data(employee.list[0],'initialdata'));
									$.data(employee.list[0],'initialdata','');
								}
							employee.listcontainer.show();
							employee.sortcontainer.show();
						},function(error){});
					}
					else
					{
						assignment.list.append($('<option>').attr('value','0').text('組織'));
						assignment.list.append($('<option>').attr('value','1').text('グループ'));
						if ($.hasData(assignment.list[0]))
							if ($.data(assignment.list[0],'initialdata').length!=0)
							{
								assignment.list.val($.data(assignment.list[0],'initialdata'));
								$.data(assignment.list[0],'initialdata','');
							}
						assignment.listcontainer.show();
						assignment.sortcontainer.show();
						employee.listcontainer.hide();
						employee.sortcontainer.hide();
					}
				}
			})
			var add=false;
			var row=null;
			var employeecolors=[];
			if (Object.keys(config).length!==0)
			{
				employeecolors=config['employeecolors'].split(',');
				$('select#shiftfromtime').val(config['shiftfromtime']);
				$('select#shifttotime').val(config['shifttotime']);
				$('select#workfromtime').val(config['workfromtime']);
				$('select#worktotime').val(config['worktotime']);
				$('select#assignmentsort').val(config['assignmentsort']);
				$('select#employee').val(config['employee']);
				$('select#employeesort').val(config['employeesort']);
				$('select#scale').val(config['scale']);
				$('select#starthour').val(config['starthour']);
				$('select#endhour').val(config['endhour']);
				$('select#charactercode').val(config['charactercode']);
				$('input#scalefixedwidth').val(config['scalefixedwidth']);
				if (config['scalefixed']=='1') $('input#scalefixed').prop('checked',true);
				/* trigger events */
				$.data($('select#assignment')[0],'initialdata',config['assignment']);
				$.data($('select#employeedisplay')[0],'initialdata',config['employeedisplay']);
			}
			else employeecolors=vars.colors;
			/* trigger events */
			$('select#employee',row).trigger('change');
			add=false;
			$.each(employeecolors,function(index){
				if (add) vars.colortable.addrow();
				else add=true;
				row=vars.colortable.rows.last();
				$('input#employeecolor',row).val(employeecolors[index].replace('#',''));
			});
			$.each($('span#employeecolor'),function(index){
				$(this).colorSelector(vars.colors,$(this).closest('tr').find('input#employeecolor'));
			});
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
		if ($('select#shiftfromtime').val()=='')
		{
			swal('Error!','勤務開始予定日時フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#shifttotime').val()=='')
		{
			swal('Error!','勤務終了予定日時フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#shiftfromtime').val()==$('select#shifttotime').val())
		{
			swal('Error!','勤務開始予定日時フィールドと勤務終了予定日時フィールドは異なるフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#workfromtime').val()=='')
		{
			swal('Error!','勤務開始日時フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#worktotime').val()=='')
		{
			swal('Error!','勤務終了日時フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#workfromtime').val()==$('select#worktotime').val())
		{
			swal('Error!','勤務開始日時フィールドと勤務終了日時フィールドは異なるフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#shiftfromtime').val()==$('select#workfromtime').val())
		{
			swal('Error!','勤務開始予定日時フィールドと勤務開始日時フィールドは異なるフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#shiftfromtime').val()==$('select#worktotime').val())
		{
			swal('Error!','勤務開始予定日時フィールドと勤務終了日時フィールドは異なるフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#shifttotime').val()==$('select#workfromtime').val())
		{
			swal('Error!','勤務終了予定日時フィールドと勤務開始日時フィールドは異なるフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#shifttotime').val()==$('select#worktotime').val())
		{
			swal('Error!','勤務終了予定日時フィールドと勤務終了日時フィールドは異なるフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#employee').val()=='')
		{
			swal('Error!','従業員フィールドを選択して下さい。','error');
			return;
		}
		if (vars.fieldinfos[$('select#employee').val()].lookup)
		{
			if ($('select#employeedisplay').val()=='')
			{
				swal('Error!','従業員名フィールドを選択して下さい。','error');
				return;
			}
			if ($('select#employeedisplay').val()==$('select#assignment').val())
			{
				swal('Error!','従業員名と配属先は異なるフィールドを選択して下さい。','error');
				return;
			}
		}
		for (var i=0;i<vars.colortable.rows.length;i++)
		{
			row=vars.colortable.rows.eq(i);
			if ($('input#employeecolor',row).val().length!=0) employeecolors.push($('input#employeecolor',row).val());
		}
		if (employeecolors.length==0)
		{
			swal('Error!','区分色を1つ以上指定して下さい。','error');
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
		if ($('select#starthour').val()=='')
		{
			swal('Error!','シフト設定開始時刻を選択して下さい。','error');
			return;
		}
		if ($('select#endhour').val()=='')
		{
			swal('Error!','シフト設定終了時刻を選択して下さい。','error');
			return;
		}
		/* setup config */
		config['shiftfromtime']=$('select#shiftfromtime').val();
		config['shifttotime']=$('select#shifttotime').val();
		config['workfromtime']=$('select#workfromtime').val();
		config['worktotime']=$('select#worktotime').val();
		config['assignment']=$('select#assignment').val();
		config['assignmentsort']=$('select#assignmentsort').val();
		config['employee']=$('select#employee').val();
		config['employeedisplay']=$('select#employeedisplay').val();
		config['employeesort']=$('select#employeesort').val();
		config['employeecolors']=employeecolors.join(',');
		config['scale']=$('select#scale').val();
		config['starthour']=$('select#starthour').val();
		config['endhour']=$('select#endhour').val();
		config['charactercode']=$('select#charactercode').val();
		config['scalefixedwidth']=$('input#scalefixedwidth').val();
		config['scalefixed']=($('input#scalefixed').prop('checked'))?'1':'0';
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
						html:'<div id="workshift-container" class="customview-container"></div>',
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
				config['workshift']=resp.views[VIEW_NAME[0]].id;
				config['works']=resp.views[VIEW_NAME[1]].id;
				config['attendance']=resp.views[VIEW_NAME[2]].id;
				/* save config */
				kintone.plugin.app.setConfig(config);
			},function(error){});
		},function(error){swal('Error!',error.message,'error');});
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);