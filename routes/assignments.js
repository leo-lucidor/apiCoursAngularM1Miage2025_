let Assignment = require('../model/assignment');

// Récupérer tous les assignments (GET)
function getAssignments(req, res){
    var aggregateQuery = Assignment.aggregate();

    Assignment.aggregatePaginate(
        aggregateQuery,
        { page: req.query.page || 1, limit: req.query.limit || 10 },
        (err, assignments) => {
            if(err){
                res.send(err)
            }
            res.send(assignments);
        }
    );
}

// Récupérer un assignment par son id (GET)
function getAssignment(req, res){
    let assignmentId = req.params.id;

    Assignment.findOne({id: assignmentId}, (err, assignment) =>{
        if(err){res.send(err)}
        res.json(assignment);
    })
}

// Ajout d'un assignment (POST)
function postAssignment(req, res){
    let assignment = new Assignment();
    assignment.id = req.body.id;
    assignment.nom = req.body.nom;
    assignment.dateDeRendu = req.body.dateDeRendu;
    assignment.rendu = req.body.rendu;

    console.log("POST assignment reçu :");
    console.log(assignment)

    assignment.save( (err, saved) => {
        if(err){
            console.error('cant post assignment', err);
            return res.status(500).json({ error: 'Erreur lors de l\'enregistrement', details: err });
        }
        // return the saved document so the client gets the _id and saved data
        res.status(201).json(saved);
    })
}

// Update d'un assignment (PUT)
function updateAssignment(req, res) {
    console.log("UPDATE recu assignment : ");
    console.log(req.body);
    // try to update by MongoDB _id if provided, otherwise try by custom numeric id
    const updateCallback = (err, assignment) => {
        if (err) {
            console.error('Erreur updateAssignment:', err);
            return res.status(500).json({ error: 'Erreur lors de la mise à jour', details: err });
        }
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment non trouvé' });
        }
        return res.json(assignment);
    };

    if (req.body._id) {
        Assignment.findByIdAndUpdate(req.body._id, req.body, {new: true}, updateCallback);
    } else if (req.body.id) {
        // numeric id stored in field 'id'
        Assignment.findOneAndUpdate({ id: req.body.id }, req.body, { new: true }, updateCallback);
    } else {
        return res.status(400).json({ error: 'Aucun identifiant fourni pour la mise à jour' });
    }

}

// suppression d'un assignment (DELETE)
function deleteAssignment(req, res) {
    const idParam = req.params.id;

    const finishNotFound = () => res.status(404).json({ message: 'Assignment non trouvé' });

    const onRemoved = (err, assignment) => {
        if (err) {
            console.error('Erreur deleteAssignment:', err);
            return res.status(500).json({ error: 'Erreur lors de la suppression', details: err });
        }
        if (!assignment) {
            return finishNotFound();
        }
        return res.json({ message: `${assignment.nom} deleted`, assignment });
    };

    // If idParam looks like a Mongo ObjectId (24 hex chars) try by _id
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idParam);
    if (isObjectId) {
        Assignment.findByIdAndRemove(idParam, onRemoved);
    } else {
        // try to remove by custom numeric 'id' field
        // convert to number if possible
        const numericId = isNaN(idParam) ? idParam : Number(idParam);
        Assignment.findOneAndRemove({ id: numericId }, onRemoved);
    }
}



module.exports = { getAssignments, postAssignment, getAssignment, updateAssignment, deleteAssignment };
