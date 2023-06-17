import { Component, NgZone, OnInit } from '@angular/core';
import { Assignment } from './assignment.model';
import { AssignmentsService } from '../shared/assignments.service';
import { transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { AddAssignmentComponent } from './add-assignment/add-assignment.component';
import { AssignmentDetailComponent } from './assignment-detail/assignment-detail.component';
import { UsersService } from '../shared/users.service';
import { MatieresService } from '../shared/matieres.service';
import { AddNoteComponent } from './add-note/add-note.component';
import { DeleteNoteComponent } from './delete-note/delete-note.component';


@Component({
  selector: 'app-assignments',
  templateUrl: './assignments.component.html',
  styleUrls: ['./assignments.component.css']
})
export class AssignmentsComponent implements OnInit {
  titre="Liste des devoirs à rendre";
  // les données à afficher
  assignments:Assignment[] = [];
  rendus : Assignment[] = [];
  nonRendus : Assignment[] = [];
  // Pour la data table
  displayedColumns: string[] = ['id', 'nom', 'dateDeRendu', 'rendu'];

  // propriétés pour la pagination
  page: number=1;
  limit: number = 10;
  totalDocs: number = 0;

  showFirstLastButtons = true;
  pageSizeOptions = [5, 10, 25];

  searchTerm! : string;
  onSearch() {
    this.getAssignments(); 
  }
  constructor(private assignmentsService:AssignmentsService,
              private ngZone: NgZone,
              public dialog: MatDialog,
              private usersService: UsersService, private matieresService: MatieresService) {    
  }

  ngOnInit(): void {
    this.getAssignments();
  }

  getAssignments() {
    this.assignmentsService.getAssignments(this.page, this.limit)
      .subscribe(data => {
        this.mapAssignments(data.docs);
        this.limit = data.limit;
        this.totalDocs = data.totalDocs;
        
        if (!this.searchTerm) {
          this.rendus = this.assignments.filter(a => a.rendu == true);
          this.nonRendus = this.assignments.filter(a => a.rendu == false);
        } else {
          this.rendus = this.assignments.filter(a => a.rendu == true && a.nom.toLowerCase().includes(this.searchTerm.toLowerCase()));
          this.nonRendus = this.assignments.filter(a => a.rendu == false && a.nom.toLowerCase().includes(this.searchTerm.toLowerCase()));
        }
      });
  }
  
  private mapAssignments(assignments: Assignment[]): void {
    this.assignments = [];
    assignments.forEach(assignment => {
      const mappedAssignment: Assignment = {
        _id: assignment._id,
        idAssignment: assignment.idAssignment,
        nom: assignment.nom,
        dateDeRendu: assignment.dateDeRendu,
        rendu: this.confRendu(assignment),
        note: this.confNote(assignment),
        idMatiere: assignment.idMatiere,
        idEleve: assignment.idEleve,
        remarques: this.confRemarque(assignment),
      };
  
      this.matieresService.fetchMatiere(mappedAssignment);
      this.usersService.fetchEleve(mappedAssignment);
      this.usersService.fetchProf(mappedAssignment);
      this.assignments.push(mappedAssignment);
    });
  }

  private confRendu(assignment: Assignment): boolean {
    // if assignment.rendu? is undefined or null, then return false
    return assignment.rendu ? assignment.rendu : false;
  }

  private confNote(assignment: Assignment): number {
    // if assignment.note? is undefined or null, then return 0
    return assignment.note ? assignment.note : 0;
  }

  private confRemarque(assignment: Assignment): string {
    // if assignment.remarques? is undefined or null, then return ""
    return assignment.remarques ? assignment.remarques : "";
  }
  
  // Pour mat-paginator
  handlePage(event: any) {
    this.page = event.pageIndex+1;
    this.limit = event.pageSize;

    this.getAssignments();
  }


  onDrop(event: any) {
    if(event.previousContainer != event.container){
        let dropped = event.previousContainer.data[event.previousIndex];
        //placer l'element dans le container où il a été déposé 
        transferArrayItem(event.previousContainer.data,
                          event.container.data,
                          event.previousIndex,
                          event.currentIndex
                        );

        if(event.container.id == "rendus"){  // si ils sont déposés dans le div #rendus, besoin si ajout d'annulation de rendu
          console.log("rendre le devoir ", dropped);
          this.dialog.open(AddNoteComponent, { disableClose: true,  maxWidth: '20vw', data: { assignment : dropped, event: event} });
        }else{
          this.dialog.open(DeleteNoteComponent, { disableClose:true, maxWidth: '30vw', data: { assignment: dropped, event: event } });
        }
    }
  } 

  onAjoutDevoir() {
    const dialogRef = this.dialog.open(AddAssignmentComponent, {maxWidth:'35vw'});
    // Subscribe to the assignmentCreated event
    dialogRef.componentInstance.assignmentCreated.subscribe((newAssignment: Assignment) => {
      // Add the new assignment to the list of assignments
      this.assignments.unshift(newAssignment);
    });
  }

  onDetailDevoir(assignment: Assignment) {
    if(!assignment) return;
    const dialogRef = this.dialog.open(AssignmentDetailComponent, {
      width:'35vw',
      data: assignment});
    // dialogRef.afterClosed().subscribe(result => {
    //   this.getAssignments();
    // });
    // dialogRef.componentInstance.assignmentDeleted.subscribe((assignmentDeleted: Assignment) => {
    //   console.log("assignmentDeleted")
    //   console.log(assignmentDeleted)
    //   this.assignments = this.assignments.filter(assignment => assignment.idAssignment !== assignmentDeleted.idAssignment);
    // });
  }
}
