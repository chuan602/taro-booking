(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-106a638b"],{"0935":function(e,t,a){},1:function(e,t){},"18aa":function(e,t,a){"use strict";var n=a("0935"),s=a.n(n);s.a},2:function(e,t){},3:function(e,t){},3796:function(e,t,a){"use strict";var n=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",[a("input",{ref:"excel-upload-input",staticClass:"excel-upload-input",attrs:{type:"file",accept:".xlsx, .xls"},on:{change:e.handleClick}}),e._v(" "),a("div",{staticClass:"drop",on:{drop:e.handleDrop,dragover:e.handleDragover,dragenter:e.handleDragover}},[e._v("\n    请把Excel文件拖拽到这里 或\n    "),a("el-button",{staticStyle:{"margin-left":"16px"},attrs:{loading:e.loading,size:"mini",type:"primary"},on:{click:e.handleUpload}},[e._v("\n      选择文件\n    ")])],1)])},s=[],r=(a("7f7f"),a("1146")),l=a.n(r),i={props:{beforeUpload:Function,onSuccess:Function},data:function(){return{loading:!1,excelData:{header:null,results:null}}},methods:{generateData:function(e){var t=e.header,a=e.results;this.excelData.header=t,this.excelData.results=a,this.onSuccess&&this.onSuccess(this.excelData)},handleDrop:function(e){if(e.stopPropagation(),e.preventDefault(),!this.loading){var t=e.dataTransfer.files;if(1===t.length){var a=t[0];if(!this.isExcel(a))return this.$message.error("Only supports upload .xlsx, .xls, .csv suffix files"),!1;this.upload(a),e.stopPropagation(),e.preventDefault()}else this.$message.error("Only support uploading one file!")}},handleDragover:function(e){e.stopPropagation(),e.preventDefault(),e.dataTransfer.dropEffect="copy"},handleUpload:function(){this.$refs["excel-upload-input"].click()},handleClick:function(e){var t=e.target.files,a=t[0];a&&this.upload(a)},upload:function(e){if(this.$refs["excel-upload-input"].value=null,this.beforeUpload){var t=this.beforeUpload(e);t&&this.readerData(e)}else this.readerData(e)},readerData:function(e){var t=this;return this.loading=!0,new Promise((function(a,n){var s=new FileReader;s.onload=function(e){var n=e.target.result,s=l.a.read(n,{type:"array",cellDates:!0}),r=s.SheetNames[0],i=s.Sheets[r],o=t.getHeaderRow(i),c=l.a.utils.sheet_to_json(i);t.generateData({header:o,results:c}),t.loading=!1,a()},s.readAsArrayBuffer(e)}))},getHeaderRow:function(e){var t,a=[],n=l.a.utils.decode_range(e["!ref"]),s=n.s.r;for(t=n.s.c;t<=n.e.c;++t){var r=e[l.a.utils.encode_cell({c:t,r:s})],i="UNKNOWN "+t;r&&r.t&&(i=l.a.utils.format_cell(r)),a.push(i)}return a},isExcel:function(e){return/\.(xlsx|xls|csv)$/.test(e.name)}}},o=i,c=(a("18aa"),a("2877")),u=Object(c["a"])(o,n,s,!1,null,"aa97b88a",null);t["a"]=u.exports},"48d3":function(e,t,a){},e8b2:function(e,t,a){"use strict";a.r(t);var n=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{staticClass:"app-container"},[a("h3",[e._v("导入用户数据")]),e._v(" "),a("upload-excel-component",{attrs:{"on-success":e.handleSuccess,"before-upload":e.beforeUpload}}),e._v(" "),a("div",[a("el-button",{attrs:{loading:e.submitLoading,size:"medium ",type:"primary",disabled:!e.tableData.length},on:{click:e.handleSubmit}},[e._v("\n      确认导入\n    ")])],1),e._v(" "),a("el-table",{staticStyle:{width:"100%","margin-top":"20px"},attrs:{data:e.tableData,border:"","highlight-current-row":""}},e._l(e.tableHeader,(function(t){return a("el-table-column",{key:t,attrs:{prop:t,label:t,formatter:e.dateFormat}})})),1)],1)},s=[],r=a("6f8e"),l=a("3796"),i=a("2f62"),o=Object(i["a"])("excel"),c=o.mapActions,u={name:"UploadUserExcel",components:{UploadExcelComponent:l["a"]},data:function(){return{tableData:[],tableHeader:[],submitLoading:!1}},methods:Object(r["a"])({beforeUpload:function(e){var t=e.size/1024/1024<1;return!!t||(this.$message({message:"上传的文件不能大于1M",type:"warning"}),!1)},handleSuccess:function(e){var t=e.results,a=e.header;console.log("results",t),console.log("header",a),this.tableData=t,this.tableHeader=a},dateFormat:function(e,t,a,n){return a},handleSubmit:function(){var e=this;this.tableData.length?(this.submitLoading=!0,this.submitUserData(this.tableData).then((function(t){e.$message({message:"数据导入成功！",type:"success"})})).catch((function(){e.$message({message:"数据导入失败！",type:"error"})})).finally((function(){e.submitLoading=!1,e.tableData=[],e.tableHeader=[]}))):this.$message({message:"当前没有数据可导入",type:"warning"})}},c(["submitUserData"]))},d=u,f=(a("f7c4"),a("2877")),p=Object(f["a"])(d,n,s,!1,null,"a57d267c",null);t["default"]=p.exports},f7c4:function(e,t,a){"use strict";var n=a("48d3"),s=a.n(n);s.a}}]);