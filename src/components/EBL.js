//cause -> details 
//opening balance -> not credit (balance 0)
//uncategorized
//auto assign+download+label,cat alada

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid, InputLabel, LinearProgress, MenuItem, Paper, Select, TextField, Typography } from '@mui/material'
import { useEffect, useRef } from 'react'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useState } from 'react'
import axios from 'axios'
import toast,{Toaster} from 'react-hot-toast';
import { CSVLink, CSVDownload } from "react-csv";



import { DataGrid } from "@mui/x-data-grid";
import moment from 'moment/moment';
     

const EBL=props=>{

    const [pdf,setPdf]=useState(null)
    const [loading,setLoading]=useState(false)

    const [selectedValue,setSelectedValue]=useState(null)

    const passRef=useRef()

    const [search,setSearch]=useState('')
    const [categories,setCategories]=useState([])
    const labelRef=useRef()
    const [totalDebit,setTotalDebit]=useState(0)
    const [totalCredit,setTotalCredit]=useState(0)

    const [csvData,setCsvData]=useState([])

    const [files,setFiles]=useState([])
    const [fileList,setFileLists]=useState([])


    const [passDialog,setPassDialog]=useState(false)

    const [passWords,setPassWords]=useState(null)


    const columns = [
        {
            field: "id",
            flex: 0.5,
            headerName: 'Serial',
         
          },
          {
            field: "category",
            flex: 0.5,
            headerName: 'Category',
            renderCell: (params) => {
                return <FormControl fullWidth>
                <Select
                    value={params.row.category}
                    // label="Category"
                    onChange={e=>{
                        // setSearch(e.target.value)
                        var arr=[]
                        sheetData.map(s=>{
                            if(s.id===params.row.id)
                                s.category=e.target.value
                            arr.push(s)
                        })
                        setSheetData(arr)
                    }}
                >
                    {
                        categories.map(c=>{
                            return(
                                <MenuItem value={c}>{c}</MenuItem>
    
                            )
                        })
                    }
         
                </Select>
                </FormControl>
            } 
          },
        { field: 'bank', headerName: 'Bank', flex: 0.75 },
        { field: 'date', headerName: 'Date', flex: 0.75,
        renderCell: (params) => {
            return <font><b>{params.row.date.toDateString()}</b></font>;
        } },
        { field: 'type', headerName: 'Type', flex: 0.75 ,
            renderCell: (params) => {
                return <font color={params.row.type==='CREDIT'?'#00dd00':'red'}><b>{params.row.type}</b></font>;
            }
        },
                     
        { field: 'amount', headerName: 'Amount', flex: 0.75 ,
        renderCell: (params) => {
            return <font color={params.row.type==='CREDIT'?'#00dd00':'red'}>{params.row.type==='CREDIT'?'':'-'}{params.row.amount}</font>;
        }
        
    },
        { field: 'balance', headerName: 'Balance', flex: 0.75,renderCell: (params) => {
            return <b>{params.row.balance}</b>;
        } },
        { field: 'reason', headerName: 'Details', flex: 1.5
    
            
    },
    // { field: 'employee', headerName: 'By', flex:  0.45   
           
    // },
    //     {
    //       field: 'frequency',
    //       headerName: 'Freq',
    //       type: 'number', flex: 0.25
    //     },
    //     { field: 'comment', headerName: 'Comment',flex: 1.25 },
    
    //     { field: 'updateTime', headerName: 'Updated At',flex: 1 },
       
      ];
    

    const changeHandler=e=>{
        setFiles(e.target.files)
        setFileLists(Array.from(e.target.files))
        if(e.target.files.length==0)return
        setPassWords(Array.from(e.target.files).map(a=>''))
        setPassDialog(true)
        //setPdf(e.target.files[0])
    }

    const [start,setStart]=useState(new Date())
    const [end,setEnd]=useState(new Date())

    const [sheetData,setSheetData]=useState(null)

    const lastUpdate=useRef(0)


    const [filteredData,setFilteredData]=useState(null)

    const isIblDate=string=>{
        return string.length===8&&moment(string,'DD/MM/YY').isValid()
    }

    const inputFileRef=useRef()

    useEffect(()=>{
        var arr=[]
        if(lastUpdate.current===0&&sheetData!==null){
            // console.log(start,end)
            
            sheetData.map(d=>{
                if(d.date>=start && d.date<=end){
                    var groups=search.split(',')
                    var isInGlobal=false
                    groups.map(g=>{
                        var keywords=g.replace(/\s+/g,' ').replace(/^\s+|\s+$/,'').split(' ')
                        var isIn=true
                        keywords.map(k=>{
                            if(d.reason.toLowerCase().indexOf(k.toLowerCase())<0 && d.bank.toLowerCase().indexOf(k.toLowerCase())<0 && d.type.toLowerCase().indexOf(k.toLowerCase())<0)
                                isIn=false
                        })
                        if(isIn)isInGlobal=true
                    })
                    if(isInGlobal)arr.push(d)
                }
            })
        }else if(lastUpdate.current===1&&sheetData!==null&&selectedValue!==null){
            // console.log(start,end)
            sheetData.map(d=>{
                if(d.category===selectedValue)arr.push(d)
            })
        }

        var tC=0,tD=0
        arr.map(a=>{
            if(a.type==='CREDIT')tC+=a.amount
            else tD+=a.amount
        })
        setTotalCredit(tC)
        setTotalDebit(tD)

        setFilteredData(arr)




        if(sheetData!==null){
            var totalC=0
            var totalD=0
            var totalT=0
            var cats=[{name:'Others',debit:0,credit:0,transactions:0,list:[]}]
            sheetData.map(s=>{
                var ind=-1
                if(s.category===null)ind=0
                else{
                    cats.map((c,i)=>{
                        if(c.name===s.category)
                            ind=i
                    })
                }
                if(ind<0){
                    cats.push({
                        name:s.category,
                        debit:0,credit:0,transactions:0,list:[]
                    })
                    ind=cats.length-1
                }
                cats[ind].transactions++
                cats[ind][s.type==='DEBIT'?'debit':'credit']+=s.amount
                cats[ind].list.push(s)
                totalT++
                if(s.type==='DEBIT')totalD+=s.amount
                else totalC+=s.amount
            })

            var data=[[
                'Category',
                'Credit',
                'Debit',
                'Transactions'
            ]]

            for(var i=1;i<cats.length;i++)
                data.push([
                    cats[i].name,
                    cats[i].credit,
                    cats[i].debit,
                    cats[i].transactions
                ])
            if(cats[0].transactions>0)
                data.push([
                    cats[0].name,
                    cats[0].credit,
                    cats[0].debit,
                    cats[0].transactions
                ])
            data.push([
                'Total',
                totalC,
                totalD,
                totalT
            ])

            for(var i=1;i<cats.length;i++){
                data.push([''])
                data.push([
                    `${cats[i].name}:`,
                    `Credit: ${cats[i].credit}`,
                    `Debit: ${cats[i].debit}`,
                    `Transactions: ${cats[i].transactions}`
                ])
                data.push([
                    'Bank',
                    'Date',
                    'Type',
                    'Amount',
                    'Details',
                    'Balance'
                ])
                cats[i].list.map(l=>{
                    data.push([
                        l.bank,
                        l.date.toDateString(),
                        l.type,
                        `${l.type==='DEBIT'?'-':''}${l.amount}`,
                        l.reason,
                        l.balance
                    ])
                })
            }
            if(cats[0].transactions>0){
                data.push([''])
                data.push([
                    `${cats[0].name}:`,
                    `Credit: ${cats[0].credit}`,
                    `Debit: ${cats[0].debit}`,
                    `Transactions: ${cats[0].transactions}`
                ])
                data.push([
                    'Bank',
                    'Date',
                    'Type',
                    'Amount',
                    'Details',
                    'Balance'
                ])
                cats[0].list.map(l=>{
                    data.push([
                        l.bank,
                        l.date.toDateString(),
                        l.type,
                        `${l.type==='DEBIT'?'-':''}${l.amount}`,
                        l.reason,
                        l.balance
                    ])
                })
            }
                

            setCsvData(data)
            

        }




    },[sheetData,search,start,end,selectedValue])


    // useEffect(()=>{
    //     console.log(start,end)
    // },[start,end])

    const uploadClick=async ()=>{
        const password=passRef.current.value
        var bodyFormData = new FormData();
        bodyFormData.append('file', pdf);
        bodyFormData.append('password', password);
        setLoading(true)
        setSheetData(null)
        var result= await axios({
            method: "post",
            url: "https://brainlytic.org/pdf",
            data: bodyFormData,
            headers: { "Content-Type": "multipart/form-data" },
          })
        setLoading(false)
        if(!result.data.success)
          toast.error(result.data.message)
        else{
            var data=result.data
            var transactions=[]

            var regExp = /[a-zA-Z]/g;

            const isAmount=string=>{
                return !regExp.test(string) && parseFloat(string.replaceAll(',',''))!==NaN && string.indexOf('.')>-1 
            }

            const getAmount=string=>{
                return parseFloat(string.replaceAll(',',''))
            }
            
            const isScbDate=string=>{
                return string.length===9&&moment(string,'DD MMM YY').isValid()
            }

            if(data.pages[0].indexOf('ebl')>0){
                data.pages.map((page,pageNo)=>{
                    var lines=page.split('\n')
                    var start=lines.indexOf('e-statement')+1
                    var end=lines.length-4
                    var currentLine=start
                    while(currentLine<=end){
                        if(lines[currentLine]==='STATEMENT CLOSING  BALANCE')
                            return
                        var type=isAmount(lines[currentLine+1])?'CREDIT':'DEBIT'
                        
                        var transac={type,bank:'EBL'}
                        if(type==='CREDIT'){
                            transac['amount']=parseFloat(lines[currentLine].replaceAll(',',''))
                            currentLine++
                            transac['balance']=parseFloat(lines[currentLine].replaceAll(',',''))
                            currentLine++
                            transac['date']=moment(lines[currentLine],'DD-MMM-YYYY').toDate()
                            currentLine++
                            var detailsWithRef=``
    
                            while(currentLine<=end && (regExp.test(lines[currentLine]) || !isAmount(lines[currentLine]))){
                                detailsWithRef+=`${lines[currentLine]}\n`
                                currentLine++
                            }
                            transac['info']=detailsWithRef
                            transactions.push(transac)
                        }else{
                            transac['balance']=parseFloat(lines[currentLine].replaceAll(',',''))
                            currentLine++
                            transac['date']=moment(lines[currentLine],'DD-MMM-YYYY').toDate()
                            currentLine++
                            var detailsWithRef=``
                            while(currentLine<=end && (regExp.test(lines[currentLine]) || !isAmount(lines[currentLine]))){
                                detailsWithRef+=`${lines[currentLine]}\n`
                                currentLine++
                            }
                            transac['info']=detailsWithRef
                            transac['amount']=parseFloat(lines[currentLine].replaceAll(',',''))
                            currentLine++
                            transactions.push(transac)
    
                        }
                        
                    }
                })
            }else if(data.pages[0].indexOf('Islami')>=0){
                data.pages.map((page,pageNo)=>{
                    var lines=[]
                    page.split('\n').map(l=>{
                        if(l.trim().length>0)
                            lines.push(l.trim())
                    })

                    var currentLine=0

                    while(!isIblDate(lines[currentLine]))currentLine++;
                    
                    while(currentLine<lines.length){
                        if(!isIblDate(lines[currentLine])) break
                        var date=lines[currentLine]
                        currentLine++
                        var info=``
                        while(regExp.test(lines[currentLine])||!isAmount(lines[currentLine]))info+=`${lines[currentLine++]}\n`
                        var creditAmount=getAmount(lines[currentLine])
                        currentLine++
                        var debitAmount=getAmount(lines[currentLine])
                        currentLine++
                        var type=debitAmount>0?'DEBIT':'CREDIT'
                        var amount=debitAmount>0?debitAmount:creditAmount
                        var balance=getAmount(lines[currentLine])
                        currentLine+=2
                        var transac={date:moment(date,'DD/MM/YY').toDate(),amount,balance,type,info,bank:'IBBL'}
                        transactions.push(transac)
                    }
                })
            }
            else{
                var currentBalance
                data.pages.map((page,pageNo)=>{
                    var lines=[]
                    page.split('\n').map(l=>{
                        if(l.trim().length>0)
                            lines.push(l.trim())
                    })
                    var currentLine=0
                    if(pageNo===0){
                        var tmpLine=lines.indexOf('BALANCE BROUGHT FORWARD')
                        currentBalance=getAmount(lines[tmpLine+1])
                        currentLine=tmpLine+2
                    }else{
                        var tmpLine=lines.indexOf('Balance')
                        currentLine=tmpLine+1
                    }
                
                    while(currentLine<lines.length){
                        if(!isScbDate(lines[currentLine])) break
                        if(isScbDate(lines[currentLine])&&isScbDate(lines[currentLine+1]))
                            currentLine++
                
                        var date=lines[currentLine]
                        currentLine++
                        var info=``
                        while(regExp.test(lines[currentLine])&&!isAmount(lines[currentLine]))info+=`${lines[currentLine++]}\n`
                        var amount=getAmount(lines[currentLine])
                        currentLine++
                        var balance=getAmount(lines[currentLine])
                        var type=balance>currentBalance?'CREDIT':'DEBIT'
                        currentBalance=balance
                        var transac={date:moment(date,'DD MMM YY').toDate(),amount,balance,type,info,bank:'SCBL'}
                        currentLine++
                        transactions.push(transac)
                    }
                
                })
            }

            

            var arr=[]
            var minDate=new Date('2070-01-01')
            var maxDate=new Date('1970-01-01')

            // console.log(minDate)
            // console.log(maxDate)
            // console.log(transactions)
            transactions.map((t,i)=>{
                // console.log(t.date)
                if(t.date<minDate)minDate=new Date(t.date)
                if(t.date>maxDate)maxDate=new Date(t.date)
                if(i===0&&(t.bank==='EBL'||t.bank==='IBBL'))
                    t.amount=0
                arr.push({
                    date:t.date,
                    amount:t.amount,
                    type:t.type,
                    balance:t.balance,
                    id:i+1,
                    reason:t.info,
                    bank:t.bank,
                    category:null
                })
            })

            minDate.setDate(minDate.getDate()-2)
            maxDate.setDate(maxDate.getDate()+2)

            setStart(minDate)
            setEnd(maxDate)

            // console.log(minDate)
            // console.log(maxDate)

            setSheetData(arr)
        }
        // console.log(result.data)
    }

    const processAStatement=data=>{
        var transactions=[]

        var regExp = /[a-zA-Z]/g;

        const isAmount=string=>{
            return !regExp.test(string) && parseFloat(string.replaceAll(',',''))!==NaN && string.indexOf('.')>-1 
        }

        const getAmount=string=>{
            return parseFloat(string.replaceAll(',',''))
        }
        
        const isScbDate=string=>{
            return string.length===9&&moment(string,'DD MMM YY').isValid()
        }

        if(data.pages[0].indexOf('ebl')>0){
            data.pages.map((page,pageNo)=>{
                var lines=page.split('\n')
                var start=lines.indexOf('e-statement')+1
                var end=lines.length-4
                var currentLine=start
                while(currentLine<=end){
                    if(lines[currentLine]==='STATEMENT CLOSING  BALANCE')
                        return
                    var type=isAmount(lines[currentLine+1])?'CREDIT':'DEBIT'
                    
                    var transac={type,bank:'EBL'}
                    if(type==='CREDIT'){
                        transac['amount']=parseFloat(lines[currentLine].replaceAll(',',''))
                        currentLine++
                        transac['balance']=parseFloat(lines[currentLine].replaceAll(',',''))
                        currentLine++
                        transac['date']=moment(lines[currentLine],'DD-MMM-YYYY').toDate()
                        currentLine++
                        var detailsWithRef=``

                        while(currentLine<=end && (regExp.test(lines[currentLine]) || !isAmount(lines[currentLine]))){
                            detailsWithRef+=`${lines[currentLine]}\n`
                            currentLine++
                        }
                        transac['info']=detailsWithRef
                        transactions.push(transac)
                    }else{
                        transac['balance']=parseFloat(lines[currentLine].replaceAll(',',''))
                        currentLine++
                        transac['date']=moment(lines[currentLine],'DD-MMM-YYYY').toDate()
                        currentLine++
                        var detailsWithRef=``
                        while(currentLine<=end && (regExp.test(lines[currentLine]) || !isAmount(lines[currentLine]))){
                            detailsWithRef+=`${lines[currentLine]}\n`
                            currentLine++
                        }
                        transac['info']=detailsWithRef
                        transac['amount']=parseFloat(lines[currentLine].replaceAll(',',''))
                        currentLine++
                        transactions.push(transac)

                    }
                    
                }
            })
        }else if(data.pages[0].indexOf('Islami')>=0){
            data.pages.map((page,pageNo)=>{
                var lines=[]
                page.split('\n').map(l=>{
                    if(l.trim().length>0)
                        lines.push(l.trim())
                })

                var currentLine=0

                while(!isIblDate(lines[currentLine]))currentLine++;
                
                while(currentLine<lines.length){
                    if(!isIblDate(lines[currentLine])) break
                    var date=lines[currentLine]
                    currentLine++
                    var info=``
                    while(regExp.test(lines[currentLine])||!isAmount(lines[currentLine]))info+=`${lines[currentLine++]}\n`
                    var creditAmount=getAmount(lines[currentLine])
                    currentLine++
                    var debitAmount=getAmount(lines[currentLine])
                    currentLine++
                    var type=debitAmount>0?'DEBIT':'CREDIT'
                    var amount=debitAmount>0?debitAmount:creditAmount
                    var balance=getAmount(lines[currentLine])
                    currentLine+=2
                    var transac={date:moment(date,'DD/MM/YY').toDate(),amount,balance,type,info,bank:'IBBL'}
                    transactions.push(transac)
                }
            })
        }
        else{
            var currentBalance
            data.pages.map((page,pageNo)=>{
                var lines=[]
                page.split('\n').map(l=>{
                    if(l.trim().length>0)
                        lines.push(l.trim())
                })
                var currentLine=0
                if(pageNo===0){
                    var tmpLine=lines.indexOf('BALANCE BROUGHT FORWARD')
                    currentBalance=getAmount(lines[tmpLine+1])
                    currentLine=tmpLine+2
                }else{
                    var tmpLine=lines.indexOf('Balance')
                    currentLine=tmpLine+1
                }
            
                while(currentLine<lines.length){
                    if(!isScbDate(lines[currentLine])) break
                    if(isScbDate(lines[currentLine])&&isScbDate(lines[currentLine+1]))
                        currentLine++
            
                    var date=lines[currentLine]
                    currentLine++
                    var info=``
                    while(regExp.test(lines[currentLine])&&!isAmount(lines[currentLine]))info+=`${lines[currentLine++]}\n`
                    var amount=getAmount(lines[currentLine])
                    currentLine++
                    var balance=getAmount(lines[currentLine])
                    var type=balance>currentBalance?'CREDIT':'DEBIT'
                    currentBalance=balance
                    var transac={date:moment(date,'DD MMM YY').toDate(),amount,balance,type,info,bank:'SCBL'}
                    currentLine++
                    transactions.push(transac)
                }
            
            })
        }
        return transactions
    }


    const submitClick=async ()=>{
        const tasks=[]
        var i=0
        for (var file of files){
            var bodyFormData = new FormData();
            bodyFormData.append('file', file);
            bodyFormData.append('password', passWords[i]);
            console.log(file,passWords[i])
            tasks.push(axios({
                method: "post",
                url: "https://brainlytic.org/pdf",
                data: bodyFormData,
                headers: { "Content-Type": "multipart/form-data" },
            }))
            i++
        }
        // return
        setLoading(true)
        setSheetData(null)
        var result=await Promise.all(tasks)
        
        var isError=false
        result.map((r,i)=>{
            if(!r.data.success){
                
                toast.error(`Invalid password for ${files[i].name}`)
                isError=true
            }
        })
        setLoading(false)
        if(!isError){
            var transactions=[]
            result.map(r=>{
                var tr=processAStatement(r.data)
                // console.log(tr)
                tr.map(t=>{
                    transactions.push(t)
                })
            })

            var arr=[]
            var minDate=new Date('2070-01-01')
            var maxDate=new Date('1970-01-01')

            // console.log(minDate)
            // console.log(maxDate)
            // console.log(transactions)
            transactions.map((t,i)=>{
                // console.log(t.date)
                if(t.date<minDate)minDate=new Date(t.date)
                if(t.date>maxDate)maxDate=new Date(t.date)
                if(i===0&&(t.bank==='EBL'||t.bank==='IBBL'))
                    t.amount=0
                arr.push({
                    date:t.date,
                    amount:t.amount,
                    type:t.type,
                    balance:t.balance,
                    id:i+1,
                    reason:t.info,
                    bank:t.bank,
                    category:null
                })
            })

            minDate.setDate(minDate.getDate()-2)
            maxDate.setDate(maxDate.getDate()+2)

            setStart(minDate)
            setEnd(maxDate)

            // console.log(minDate)
            // console.log(maxDate)

            setSheetData(arr)
            setPassDialog(false)
            setLoading(false)
            inputFileRef.current.value=""
        }
    }

    const categorize=async ()=>{
        lastUpdate.current=0
        setSelectedValue(null)
        setSearch('')
        var catMap={}
        console.log(sheetData[0].category)
        sheetData.map(s=>{
            var keyName=s.reason.replaceAll(/[^a-zA-Z0-9]/g, " ").split(' ')[0].toLowerCase()
            if(Object.keys(catMap).indexOf(keyName)<0)
                catMap[keyName]=0
            catMap[keyName]++
        })
        var catArr=['Others']
        setCategories(catArr)
        Object.keys(catMap).map(k=>{
            if(catMap[k]>1)catArr.push(k)
        })
        var arr=[]
        sheetData.map(s=>{
            var keyName=s.reason.replaceAll(/[^a-zA-Z0-9]/g, " ").split(' ')[0].toLowerCase()
            if(catArr.indexOf(keyName)>=0)s.category=keyName
            else s.category='Others'
            arr.push(s)
        })
        setSheetData(arr)
        //setCategories([])
    }

    return(
        <Grid container spacing={1} padding={1}>
            <Dialog open={passDialog}>
                {loading&&<LinearProgress/>}
                <DialogTitle>
                    Enter passwords
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={1}>
                        {
                            fileList.map((f,i)=>{
                                return(
                                    <Grid item xs={12}>
                                        <Paper style={{padding:'10px'}}>
                                            <Typography>
                                                {f.name}
                                            </Typography>
                                            <TextField fullWidth
                                                variant='outlined'
                                                value={passWords?passWords[i]:''}
                                                label='Password (if needed)'
                                                onChange={e=>{
                                                    var arr=[...passWords]
                                                    arr[i]=e.target.value
                                                    setPassWords(arr)
                                                }}
                                            />
                                        </Paper>
                                    </Grid>
                                )
                            })
                        }
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={()=>{
                            inputFileRef.current.value=""
                            setPassDialog(false)

                        }}
                        disabled={loading}
                        color='error'
                        >
                        Cancel
                    </Button>
                    <Button
                        onClick={submitClick}
                        color='primary'
                        disabled={loading}
                        >
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>
            <Grid item xs={12}>
                <input type="file" accept="application/pdf" name="file" ref={inputFileRef} multiple onChange={changeHandler} />
                
            </Grid>
            {/* <Grid item xs={8} md={4}>
                <TextField
                    variant='outlined'
                    label='Password'
                    fullWidth
                    type='password'
                    inputRef={passRef}
                />
            </Grid>
            <Grid item xs={4} md={2}>
                <Button
                    variant='contained'
                    onClick={uploadClick}
                    disabled={pdf===null || loading}
                    fullWidth
                >
                    Analyze
                </Button>
            </Grid> */}

             
            <Grid item xs={4} md={2}>
                <Grid container spacing={1}>
                    <Grid item xs={12}>
                        <TextField
                            variant='outlined'
                            label='Keyword(s)'
                            fullWidth
                            value={search}
                            onChange={e=>{
                                lastUpdate.current=0
                                setSelectedValue(null)
                                setSearch(e.target.value)
                            }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            variant='contained'
                            fullWidth
                            disabled={sheetData===null || loading}
                            onClick={categorize}
                        >
                            Auto Categorize
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
            <Grid item xs={4} md={2}>
                <Grid container spacing={1}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            variant='outlined'
                            label='Label'
                            inputRef={labelRef}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            variant='outlined'
                            disabled={sheetData===null || loading}
                            fullWidth
                            onClick={()=>{
                                const label=labelRef.current.value.trim()
                                if(label.length===0)
                                    toast.error('Label name can\'t be empty')
                                else{
                                    var isIn=false
                                    categories.map(c=>{
                                        if(c===label){
                                            isIn=true
                                            toast.error('Label already exists')
                                        }
                                    })
                                    if(!isIn) {
                                        setCategories([...categories,label])
                                        
                                        var arr=[]
                                        sheetData.map(s=>{
                                            var o=s
                                            filteredData.map(f=>{
                                                if(f.id===o.id)
                                                    o.category=label
                                            })
                                            arr.push(o)
                                        })
                                        setSheetData(arr)
                                        labelRef.current.value=''

                                    }
                                }
                                
                            }}
                        >
                            + Category
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
            <Grid item xs={4} md={2}>
                <Grid container spacing={1}>
                    <Grid item xs={12}>
                    <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">Category</InputLabel>
                <Select
                    value={selectedValue}
                    label="Category"
                    onChange={e=>{
                        lastUpdate.current=1
                        setSearch('')
                        setSelectedValue(e.target.value)
                    }}
                >
                    {
                        categories.map(c=>{
                            return(
                                <MenuItem value={c}><div style={{width:'100%'}}>
                                    {c}<DeleteForeverIcon onClick={e=>{
                                        e.stopPropagation();
                                        e.preventDefault()
                                        var arr=[]
                                        categories.map(cat=>{
                                            if(c!==cat)
                                                arr.push(cat)
                                        })
                                        setCategories(arr)
                                        if(selectedValue===c){
                                            if(lastUpdate.current===1)lastUpdate.current=0
                                        
                                            setSelectedValue(null)

                                        }
                                        var arrNew=[]
                                        sheetData.map(s=>{
                                            if(s.category===c)
                                                s.category=null
                                            arrNew.push(s)
                                        })
                                        setSheetData(arrNew)
                                }} style={{float:'right'}}/>
                                    </div></MenuItem>

                            )
                        })
                    }
         
                </Select>
                </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                    <CSVLink data={csvData} filename='Statements'>Export</CSVLink>

                    </Grid>
                </Grid>
            </Grid>
            <Grid item xs={4} md={2}>
                    <TextField
                        value={new Date(start.getTime() - (start.getTimezoneOffset() * 60000)).toISOString().split('T')[0]}
                        onChange={e=>{
                            setStart(new Date(e.target.value))
                        }}
                        variant='outlined'
                        fullWidth
                        type='date'
                        label={'From'}
                    />
            </Grid>
            <Grid item xs={4} md={2}>
                    <TextField
                        value={new Date(end.getTime() - (end.getTimezoneOffset() * 60000)).toISOString().split('T')[0]}

                        onChange={e=>{
                            setEnd(new Date(e.target.value))
                        }}
                        variant='outlined'
                        fullWidth
                        type='date'
                        label={'To'}
                    />
            </Grid>
            <Grid item xs={4} md={2}>
                    <Typography variant='body'>
                        <b><u>Total Credit:</u> BDT ${totalCredit}{'/='}</b><br/>
                        <b><u>Total Debit:</u> BDT ${totalDebit}{'/='}</b>
                    </Typography>
            </Grid>
           
            
            <Grid item xs={12}>
                {
                    filteredData &&  <DataGrid
                    rows={filteredData?filteredData:[]}
                    columns={columns}
                    initialState={{
                      pagination: {
                        paginationModel: { page: 0, pageSize: 100 },
                      },
                    }}
                    pageSizeOptions={[5, 10]}
                  />
                }
            </Grid>
            <Toaster />
        </Grid>
    )
}

export default EBL